"""Read-only access to existing AutoDock Vina artifacts.

This module never invokes AutoDock Vina and never accepts a client-supplied
filesystem path. Artifact locations are derived from the related Protein PDB
ID and Biomaterial PubChem CID.
"""

from __future__ import annotations

import math
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from django.conf import settings


ARTIFACT_ROOT = Path(settings.BASE_DIR) / "docking_data" / "docking"
JOB_ARTIFACT_ROOT = Path(settings.BASE_DIR) / "docking_data" / "docking_jobs"
SUBPROCESS_TIMEOUT_SECONDS = 120

_PDB_ID_PATTERN = re.compile(r"^[A-Za-z0-9]{4}$")
_CID_PATTERN = re.compile(r"^[0-9]+$")
_AFFINITY_PATTERN = re.compile(
    r"^REMARK\s+VINA\s+RESULT:\s+"
    r"([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)"
    r"\s+"
    r"([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)"
    r"\s+"
    r"([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)"
)
_KNOWN_PDBQT_ATOM_TYPES = {
    "A", "B", "Br", "C", "Ca", "Cl", "Cu", "F", "Fe", "H", "HD",
    "I", "Mg", "Mn", "N", "NA", "Na", "OA", "O", "OS", "P", "S",
    "SA", "Si", "Zn",
}
_MEEKO_EXPORT_CANDIDATES = ("mk_export.exe", "mk_export.py", "mk_export")


class DockingArtifactUnavailable(Exception):
    """Raised when a controlled artifact cannot be safely read or generated."""


@dataclass(frozen=True)
class DockingPose:
    pose: int
    affinity_kcal_per_mol: float
    rmsd_lower_bound: float
    rmsd_upper_bound: float
    atom_count: int

    def as_dict(self) -> dict:
        return {
            "pose": self.pose,
            "affinity_kcal_per_mol": self.affinity_kcal_per_mol,
            "rmsd_lower_bound": self.rmsd_lower_bound,
            "rmsd_upper_bound": self.rmsd_upper_bound,
            "atom_count": self.atom_count,
        }


def _validated_identity(value: str, pattern: re.Pattern[str], label: str) -> str:
    value = (value or "").strip()
    if not pattern.fullmatch(value):
        raise DockingArtifactUnavailable(f"Invalid {label} for docking artifact lookup.")
    return value


def _artifact_directory_for_interaction(interaction) -> Path:
    # New jobs are resolved only through the server-side DockingJob relationship.
    job = getattr(interaction, "docking_jobs", None)
    if job is not None:
        latest = job.filter(status="completed").order_by("-attempt_count", "-created_at").first()
        if latest is not None:
            directory = JOB_ARTIFACT_ROOT / str(latest.id) / f"attempt-{latest.attempt_count}" / "docking"
            root = JOB_ARTIFACT_ROOT.resolve()
            resolved = directory.resolve()
            if root != resolved and root not in resolved.parents:
                raise DockingArtifactUnavailable("Docking artifact directory is outside the allowed root.")
            if resolved.is_dir():
                return resolved

    pdb_id = _validated_identity(
        getattr(interaction.protein, "pdb_id", ""), _PDB_ID_PATTERN, "PDB ID"
    ).upper()
    cid = _validated_identity(
        getattr(interaction.biomaterial, "pubchem_cid", ""), _CID_PATTERN, "PubChem CID"
    )

    root = ARTIFACT_ROOT.resolve()
    directory = (root / f"{pdb_id}_receptor__{cid}_ligand").resolve()
    if root != directory and root not in directory.parents:
        raise DockingArtifactUnavailable("Docking artifact directory is outside the allowed root.")
    return directory


def _expected_path(interaction, artifact_type: str) -> Path:
    if artifact_type not in {"pdbqt", "log", "sdf"}:
        raise DockingArtifactUnavailable("Unsupported docking artifact type.")

    directory = _artifact_directory_for_interaction(interaction)
    pdb_id = getattr(interaction.protein, "pdb_id").strip().upper()
    cid = getattr(interaction.biomaterial, "pubchem_cid").strip()
    pair = f"{pdb_id}_receptor__{cid}_ligand"
    filenames = {
        "pdbqt": f"{pair}_vina_out.pdbqt",
        "log": f"{pair}_vina.log",
        "sdf": f"{pair}_vina_out.sdf",
    }
    path = (directory / filenames[artifact_type]).resolve()
    if directory != path and directory not in path.parents:
        raise DockingArtifactUnavailable("Docking artifact is outside the allowed root.")
    return path


def _require_regular_file(path: Path) -> Path:
    try:
        resolved = path.resolve(strict=True)
    except FileNotFoundError as exc:
        raise DockingArtifactUnavailable("Requested docking artifact is unavailable.") from exc
    if not resolved.is_file() or resolved.stat().st_size == 0:
        raise DockingArtifactUnavailable("Requested docking artifact is unavailable.")
    return resolved


def _validate_pdbqt(path: Path) -> list[str]:
    path = _require_regular_file(path)
    atom_lines: list[str] = []
    for line_number, line in enumerate(
        path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1
    ):
        if not (line.startswith("ATOM") or line.startswith("HETATM")):
            continue
        if len(line) < 54:
            raise DockingArtifactUnavailable(
                f"Docking PDBQT contains a malformed atom record at line {line_number}."
            )
        try:
            coordinates = tuple(float(line[start:start + 8]) for start in (30, 38, 46))
        except ValueError as exc:
            raise DockingArtifactUnavailable(
                f"Docking PDBQT contains invalid coordinates at line {line_number}."
            ) from exc
        if not all(math.isfinite(value) for value in coordinates):
            raise DockingArtifactUnavailable(
                f"Docking PDBQT contains non-finite coordinates at line {line_number}."
            )
        fields = line.split()
        atom_type = fields[-1] if fields else ""
        if atom_type not in _KNOWN_PDBQT_ATOM_TYPES:
            raise DockingArtifactUnavailable(
                f"Docking PDBQT contains an unrecognized atom type at line {line_number}."
            )
        atom_lines.append(line)

    if not atom_lines:
        raise DockingArtifactUnavailable("Docking PDBQT contains no atom records.")
    return atom_lines


def _parse_poses(pdbqt_path: Path) -> list[DockingPose]:
    atom_lines = _validate_pdbqt(pdbqt_path)
    lines = pdbqt_path.read_text(encoding="utf-8", errors="replace").splitlines()
    poses: list[DockingPose] = []
    current_atom_count = 0
    current_model = 1
    saw_model = False

    for line in lines:
        if line.startswith("MODEL"):
            saw_model = True
            current_model = len(poses) + 1
            current_atom_count = 0
            continue
        if line.startswith("ATOM") or line.startswith("HETATM"):
            current_atom_count += 1
            continue
        if line.startswith("REMARK VINA RESULT:"):
            match = _AFFINITY_PATTERN.match(line.strip())
            if not match:
                raise DockingArtifactUnavailable("Docking PDBQT contains a malformed Vina result.")
            poses.append(
                DockingPose(
                    pose=len(poses) + 1,
                    affinity_kcal_per_mol=float(match.group(1)),
                    rmsd_lower_bound=float(match.group(2)),
                    rmsd_upper_bound=float(match.group(3)),
                    atom_count=0,
                )
            )
        elif line.startswith("ENDMDL") and poses:
            pose = poses[-1]
            poses[-1] = DockingPose(
                pose=pose.pose,
                affinity_kcal_per_mol=pose.affinity_kcal_per_mol,
                rmsd_lower_bound=pose.rmsd_lower_bound,
                rmsd_upper_bound=pose.rmsd_upper_bound,
                atom_count=current_atom_count,
            )

    if not poses:
        raise DockingArtifactUnavailable("Docking PDBQT contains no Vina pose results.")

    if not saw_model:
        first = poses[0]
        poses[0] = DockingPose(
            pose=first.pose,
            affinity_kcal_per_mol=first.affinity_kcal_per_mol,
            rmsd_lower_bound=first.rmsd_lower_bound,
            rmsd_upper_bound=first.rmsd_upper_bound,
            atom_count=len(atom_lines),
        )

    if any(pose.atom_count == 0 for pose in poses):
        raise DockingArtifactUnavailable("Docking PDBQT contains an incomplete pose.")
    return poses


def _resolve_meeko_export() -> Optional[str]:
    configured = os.environ.get("MEEKO_EXPORT_EXECUTABLE", "").strip()
    if configured:
        configured_path = Path(configured)
        if configured_path.is_file():
            return str(configured_path.resolve())
        found = shutil.which(configured)
        if found:
            return found
        raise DockingArtifactUnavailable("Configured Meeko export executable is unavailable.")

    candidates = list(_MEEKO_EXPORT_CANDIDATES)
    scripts_dir = Path(sys.executable).resolve().parent
    candidates.extend(str(scripts_dir / name) for name in _MEEKO_EXPORT_CANDIDATES)
    for candidate in candidates:
        found = shutil.which(candidate)
        if found:
            return found
        candidate_path = Path(candidate)
        if candidate_path.is_file():
            return str(candidate_path.resolve())
    return None


def ensure_sdf_artifact(interaction) -> Path:
    """Export the existing PDBQT to SDF with Meeko, preserving real poses."""
    sdf_path = _expected_path(interaction, "sdf")
    if sdf_path.exists():
        return _require_regular_file(sdf_path)

    pdbqt_path = _expected_path(interaction, "pdbqt")
    _parse_poses(pdbqt_path)
    executable = _resolve_meeko_export()
    if not executable:
        raise DockingArtifactUnavailable("Meeko export tool is unavailable for SDF conversion.")

    sdf_path.parent.mkdir(parents=True, exist_ok=True)
    command = [executable, str(pdbqt_path), "-s", str(sdf_path)]
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=SUBPROCESS_TIMEOUT_SECONDS,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise DockingArtifactUnavailable("Meeko could not export the docked SDF.") from exc

    if result.returncode != 0 or not sdf_path.exists() or sdf_path.stat().st_size == 0:
        if sdf_path.exists():
            sdf_path.unlink()
        raise DockingArtifactUnavailable("Meeko could not safely export the docked SDF.")

    return _require_regular_file(sdf_path)


def get_docking_artifacts(interaction, *, attempt_sdf: bool = True) -> dict:
    """Return read-only metadata for an Interaction's derived artifacts."""
    pdbqt_path = _expected_path(interaction, "pdbqt")
    log_path = _expected_path(interaction, "log")
    poses = _parse_poses(pdbqt_path)
    _require_regular_file(log_path)

    sdf_available = False
    if attempt_sdf:
        try:
            ensure_sdf_artifact(interaction)
            sdf_available = True
        except DockingArtifactUnavailable:
            sdf_available = False
    else:
        sdf_available = sdf_path_exists = _expected_path(interaction, "sdf").is_file()
        del sdf_path_exists

    return {
        "interaction_id": interaction.id,
        "receptor_pdb_id": interaction.protein.pdb_id.strip().upper(),
        "pubchem_cid": interaction.biomaterial.pubchem_cid.strip(),
        "pose_count": len(poses),
        "best_affinity_kcal_per_mol": min(pose.affinity_kcal_per_mol for pose in poses),
        "poses": [pose.as_dict() for pose in poses],
        "sdf_available": sdf_available,
        "pdbqt_filename": pdbqt_path.name,
        "log_filename": log_path.name,
    }


def get_artifact_path(interaction, artifact_type: str) -> Path:
    """Resolve one allowlisted artifact path and fail closed if unavailable."""
    path = _expected_path(interaction, artifact_type)
    return _require_regular_file(path)
