"""
Step 6D: real AutoDock Vina docking execution.

This service consumes already-prepared real receptor and ligand PDBQT files,
executes AutoDock Vina, and validates the real docking output. It does not
write to Django models, create docking scores, modify preparation services,
or expose an API endpoint.
"""

from __future__ import annotations

import math
import os
import re
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Sequence

from django.conf import settings


SUBPROCESS_TIMEOUT_SECONDS = 900

_VINA_EXECUTABLE_CANDIDATES = (
    "vina.exe",
    "vina",
    "autodock_vina.exe",
    "autodock_vina",
)

_DEFAULT_VINA_LOCATIONS = (
    Path(settings.BASE_DIR) / "tools" / "vina" / "vina.exe",
    Path(settings.BASE_DIR) / "docking_tools" / "vina.exe",
    Path(settings.BASE_DIR) / "vina" / "vina.exe",
)

_KNOWN_PDBQT_ATOM_TYPES = {
    "A",
    "B",
    "Br",
    "C",
    "Ca",
    "Cl",
    "Cu",
    "F",
    "Fe",
    "H",
    "HD",
    "I",
    "Mg",
    "Mn",
    "N",
    "NA",
    "Na",
    "OA",
    "O",
    "OS",
    "P",
    "S",
    "SA",
    "Si",
    "Zn",
}

_AFFINITY_PATTERN = re.compile(
    r"^REMARK\s+VINA\s+RESULT:\s+"
    r"([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)"
)


class DockingExecutionError(Exception):
    """Raised when Vina execution or docking-output validation fails."""


@dataclass(frozen=True)
class DockingBox:
    """Explicit search box in Angstroms."""

    center_x: float = 6.247
    center_y: float = 12.577
    center_z: float = 20.937
    size_x: float = 20.0
    size_y: float = 20.0
    size_z: float = 20.0

    def as_dict(self) -> dict[str, float]:
        return {
            "center_x": self.center_x,
            "center_y": self.center_y,
            "center_z": self.center_z,
            "size_x": self.size_x,
            "size_y": self.size_y,
            "size_z": self.size_z,
        }


@dataclass
class DockingResult:
    receptor_pdbqt_path: Path
    ligand_pdbqt_path: Path
    output_pdbqt_path: Path
    log_path: Path
    vina_executable: str
    vina_version: str
    box: DockingBox
    seed: int
    exhaustiveness: int
    cpu: int
    pose_count: int
    ligand_atom_count: int
    output_atom_count_first_pose: int
    affinities_kcal_per_mol: list[float]
    warnings: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "receptor_pdbqt_path": str(self.receptor_pdbqt_path),
            "ligand_pdbqt_path": str(self.ligand_pdbqt_path),
            "output_pdbqt_path": str(self.output_pdbqt_path),
            "log_path": str(self.log_path),
            "vina_executable": self.vina_executable,
            "vina_version": self.vina_version,
            "box": self.box.as_dict(),
            "seed": self.seed,
            "exhaustiveness": self.exhaustiveness,
            "cpu": self.cpu,
            "pose_count": self.pose_count,
            "ligand_atom_count": self.ligand_atom_count,
            "output_atom_count_first_pose": self.output_atom_count_first_pose,
            "affinities_kcal_per_mol": self.affinities_kcal_per_mol,
            "warnings": self.warnings,
        }


def _resolve_vina_executable() -> Optional[str]:
    """Resolve Vina from an explicit environment path, project locations, or PATH."""
    configured = os.environ.get("VINA_EXECUTABLE", "").strip()
    if configured:
        configured_path = Path(configured)
        if configured_path.is_file():
            return str(configured_path.resolve())
        configured_found = shutil.which(configured)
        if configured_found:
            return configured_found
        raise DockingExecutionError(
            f"VINA_EXECUTABLE is set but does not point to an executable: {configured}"
        )

    for candidate_path in _DEFAULT_VINA_LOCATIONS:
        if candidate_path.is_file():
            return str(candidate_path.resolve())

    for candidate in _VINA_EXECUTABLE_CANDIDATES:
        found = shutil.which(candidate)
        if found:
            return found
    return None


def _run_vina_help(executable: str) -> str:
    """Read the executable version/help text before running a docking job."""
    try:
        result = subprocess.run(
            [executable, "--version"],
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise DockingExecutionError(
            f"Vina executable could not be started: {executable}: {exc}"
        ) from exc

    combined = f"{result.stdout}\n{result.stderr}".strip()
    if result.returncode != 0 or not combined:
        raise DockingExecutionError(
            f"Vina executable did not respond successfully to --version: {combined}"
        )
    return combined.splitlines()[0].strip()


def _parse_pdbqt_atom_lines(path: Path) -> list[str]:
    if not path.exists() or path.stat().st_size == 0:
        raise DockingExecutionError(f"PDBQT input is missing or empty: {path}")

    atom_lines: list[str] = []
    for line_number, line in enumerate(
        path.read_text(encoding="utf-8", errors="replace").splitlines(),
        start=1,
    ):
        if not (line.startswith("ATOM") or line.startswith("HETATM")):
            continue
        if len(line) < 54:
            raise DockingExecutionError(
                f"PDBQT atom record is too short at {path}:{line_number}."
            )
        try:
            coordinates = tuple(
                float(line[start:start + 8]) for start in (30, 38, 46)
            )
        except ValueError as exc:
            raise DockingExecutionError(
                f"PDBQT has invalid coordinates at {path}:{line_number}."
            ) from exc
        if not all(math.isfinite(value) for value in coordinates):
            raise DockingExecutionError(
                f"PDBQT has non-finite coordinates at {path}:{line_number}."
            )

        fields = line.split()
        atom_type = fields[-1] if fields else ""
        if atom_type not in _KNOWN_PDBQT_ATOM_TYPES:
            raise DockingExecutionError(
                f"PDBQT has unrecognized AutoDock atom type {atom_type!r} "
                f"at {path}:{line_number}."
            )
        atom_lines.append(line)

    if not atom_lines:
        raise DockingExecutionError(f"PDBQT contains no atom records: {path}")
    return atom_lines


def _validate_output_pdbqt(
    path: Path, expected_ligand_atom_count: int
) -> tuple[int, int, list[float]]:
    atom_lines = _parse_pdbqt_atom_lines(path)
    text_lines = path.read_text(encoding="utf-8", errors="replace").splitlines()

    affinities: list[float] = []
    for line in text_lines:
        match = _AFFINITY_PATTERN.match(line.strip())
        if match:
            affinities.append(float(match.group(1)))

    if not affinities:
        raise DockingExecutionError(
            f"Vina output contains no parseable REMARK VINA RESULT affinities: {path}"
        )

    model_count = sum(1 for line in text_lines if line.startswith("MODEL"))
    end_model_count = sum(1 for line in text_lines if line.startswith("ENDMDL"))
    if model_count == 0:
        model_count = 1
    if end_model_count not in (0, model_count):
        raise DockingExecutionError(
            f"Vina output has inconsistent MODEL/ENDMDL records: "
            f"MODEL={model_count}, ENDMDL={end_model_count}."
        )

    if len(affinities) != model_count:
        raise DockingExecutionError(
            f"Vina output pose/affinity count mismatch: poses={model_count}, "
            f"affinities={len(affinities)}."
        )

    first_pose_atom_count = 0
    in_first_pose = model_count == 1
    for line in text_lines:
        if line.startswith("MODEL"):
            if first_pose_atom_count == 0:
                in_first_pose = True
            elif in_first_pose:
                in_first_pose = False
        elif line.startswith("ENDMDL") and in_first_pose:
            in_first_pose = False
        elif in_first_pose and (line.startswith("ATOM") or line.startswith("HETATM")):
            first_pose_atom_count += 1

    if first_pose_atom_count != expected_ligand_atom_count:
        raise DockingExecutionError(
            "Vina output first-pose atom count does not match the ligand input: "
            f"output={first_pose_atom_count}, input={expected_ligand_atom_count}."
        )

    return model_count, first_pose_atom_count, affinities


def run_docking(
    receptor_pdbqt_path: str | Path,
    ligand_pdbqt_path: str | Path,
    *,
    output_dir: str | Path | None = None,
    box: DockingBox | None = None,
    seed: int = 62024,
    exhaustiveness: int = 8,
    cpu: int = 1,
    num_modes: int = 9,
    energy_range: float = 3.0,
) -> DockingResult:
    """Run one real rigid-receptor Vina docking calculation and validate it."""
    receptor_path = Path(receptor_pdbqt_path)
    ligand_path = Path(ligand_pdbqt_path)
    receptor_atoms = _parse_pdbqt_atom_lines(receptor_path)
    ligand_atoms = _parse_pdbqt_atom_lines(ligand_path)
    del receptor_atoms

    if seed < 0:
        raise DockingExecutionError("Vina seed must be non-negative.")
    if exhaustiveness <= 0 or cpu <= 0 or num_modes <= 0 or energy_range <= 0:
        raise DockingExecutionError(
            "exhaustiveness, cpu, num_modes, and energy_range must be positive."
        )

    box = box or DockingBox()
    if any(value <= 0 for value in (box.size_x, box.size_y, box.size_z)):
        raise DockingExecutionError("Docking box sizes must be positive.")

    executable = _resolve_vina_executable()
    if not executable:
        raise DockingExecutionError(
            "AutoDock Vina was not found. Set VINA_EXECUTABLE to the full path "
            "of vina.exe or place it at <BASE_DIR>/tools/vina/vina.exe."
        )
    vina_version = _run_vina_help(executable)

    receptor_label = receptor_path.stem
    ligand_label = ligand_path.stem
    pair_label = f"{receptor_label}__{ligand_label}"
    destination = (
        Path(output_dir)
        if output_dir is not None
        else Path(settings.BASE_DIR) / "docking_data" / "docking" / pair_label
    )
    destination.mkdir(parents=True, exist_ok=True)
    output_path = destination / f"{pair_label}_vina_out.pdbqt"
    log_path = destination / f"{pair_label}_vina.log"
    for old_path in (output_path, log_path):
        if old_path.exists():
            old_path.unlink()

    command: Sequence[str] = (
        executable,
        "--receptor",
        str(receptor_path),
        "--ligand",
        str(ligand_path),
        "--center_x",
        f"{box.center_x:.3f}",
        "--center_y",
        f"{box.center_y:.3f}",
        "--center_z",
        f"{box.center_z:.3f}",
        "--size_x",
        f"{box.size_x:.3f}",
        "--size_y",
        f"{box.size_y:.3f}",
        "--size_z",
        f"{box.size_z:.3f}",
        "--exhaustiveness",
        str(exhaustiveness),
        "--cpu",
        str(cpu),
        "--seed",
        str(seed),
        "--num_modes",
        str(num_modes),
        "--energy_range",
        f"{energy_range:.3f}",
        "--out",
        str(output_path),
    )

    try:
        result = subprocess.run(
            list(command),
            capture_output=True,
            text=True,
            timeout=SUBPROCESS_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise DockingExecutionError(
            f"Vina docking timed out after {SUBPROCESS_TIMEOUT_SECONDS}s."
        ) from exc
    except OSError as exc:
        raise DockingExecutionError(
            f"Could not start Vina executable {executable}: {exc}"
        ) from exc

    log_path.write_text(
        f"Command: {' '.join(command)}\n\n"
        f"STDOUT:\n{result.stdout}\n\n"
        f"STDERR:\n{result.stderr}\n",
        encoding="utf-8",
    )

    if result.returncode != 0:
        raise DockingExecutionError(
            "AutoDock Vina failed:\n"
            f"stdout: {result.stdout.strip()}\n"
            f"stderr: {result.stderr.strip()}"
        )

    if not output_path.exists():
        raise DockingExecutionError(
            f"Vina reported success but output PDBQT is missing: {output_path}"
        )
    if not log_path.exists() or log_path.stat().st_size == 0:
        raise DockingExecutionError(
            f"Vina execution log is missing or empty: {log_path}"
        )

    pose_count, first_pose_atom_count, affinities = _validate_output_pdbqt(
        output_path, expected_ligand_atom_count=len(ligand_atoms)
    )

    return DockingResult(
        receptor_pdbqt_path=receptor_path,
        ligand_pdbqt_path=ligand_path,
        output_pdbqt_path=output_path,
        log_path=log_path,
        vina_executable=executable,
        vina_version=vina_version,
        box=box,
        seed=seed,
        exhaustiveness=exhaustiveness,
        cpu=cpu,
        pose_count=pose_count,
        ligand_atom_count=len(ligand_atoms),
        output_atom_count_first_pose=first_pose_atom_count,
        affinities_kcal_per_mol=affinities,
    )


run_vina_docking = run_docking
