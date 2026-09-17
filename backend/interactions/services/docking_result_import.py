"""
Import an already verified AutoDock Vina result into ProMatDB.

This service deliberately does not invoke Vina. It consumes an existing,
validated Vina output PDBQT and log, links them to existing Protein and
Biomaterial rows, and stores only the real Vina affinity in Interaction.docking_score.
Experimental binding_energy remains NULL for docking-only results.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from django.conf import settings
from django.db import transaction

from biomaterials.models import Biomaterial
from interactions.models import Interaction
from proteins.models import Protein


_AFFINITY_PATTERN = re.compile(
    r"^REMARK\s+VINA\s+RESULT:\s+"
    r"([-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?)"
)

_KNOWN_PDBQT_ATOM_TYPES = {
    "A", "B", "Br", "C", "Ca", "Cl", "Cu", "F", "Fe", "H", "HD",
    "I", "Mg", "Mn", "N", "NA", "Na", "OA", "O", "OS", "P", "S",
    "SA", "Si", "Zn",
}


class DockingResultImportError(Exception):
    """Raised when an existing docking artifact cannot be safely imported."""


@dataclass
class DockingResultImportResult:
    interaction: Interaction
    created: bool
    protein_id: int
    biomaterial_id: int
    receptor_pdb_id: str
    pubchem_cid: str
    output_pdbqt_path: Path
    log_path: Path
    pose_count: int
    affinities_kcal_per_mol: list[float]
    docking_score: float
    binding_energy: None = None

    def as_dict(self) -> dict:
        return {
            "interaction_id": self.interaction.id,
            "created": self.created,
            "protein_id": self.protein_id,
            "biomaterial_id": self.biomaterial_id,
            "receptor_pdb_id": self.receptor_pdb_id,
            "pubchem_cid": self.pubchem_cid,
            "output_pdbqt_path": str(self.output_pdbqt_path),
            "log_path": str(self.log_path),
            "pose_count": self.pose_count,
            "affinities_kcal_per_mol": self.affinities_kcal_per_mol,
            "docking_score": self.docking_score,
            "binding_energy": None,
        }


def _read_atom_lines(path: Path) -> list[str]:
    if not path.exists() or path.stat().st_size == 0:
        raise DockingResultImportError(f"Docking PDBQT is missing or empty: {path}")

    atom_lines: list[str] = []
    for line_number, line in enumerate(
        path.read_text(encoding="utf-8", errors="replace").splitlines(),
        start=1,
    ):
        if not (line.startswith("ATOM") or line.startswith("HETATM")):
            continue
        if len(line) < 54:
            raise DockingResultImportError(
                f"Docking PDBQT atom record is too short at {path}:{line_number}."
            )
        try:
            coordinates = tuple(
                float(line[start:start + 8]) for start in (30, 38, 46)
            )
        except ValueError as exc:
            raise DockingResultImportError(
                f"Docking PDBQT has invalid coordinates at {path}:{line_number}."
            ) from exc
        if not all(math.isfinite(value) for value in coordinates):
            raise DockingResultImportError(
                f"Docking PDBQT has non-finite coordinates at {path}:{line_number}."
            )

        fields = line.split()
        atom_type = fields[-1] if fields else ""
        if atom_type not in _KNOWN_PDBQT_ATOM_TYPES:
            raise DockingResultImportError(
                f"Docking PDBQT has unrecognized AutoDock atom type "
                f"{atom_type!r} at {path}:{line_number}."
            )
        atom_lines.append(line)

    if not atom_lines:
        raise DockingResultImportError(
            f"Docking PDBQT contains no ATOM/HETATM records: {path}"
        )
    return atom_lines


def _parse_vina_output(output_path: Path) -> tuple[int, list[float]]:
    """Validate output structure and return (pose_count, affinities)."""
    _read_atom_lines(output_path)
    lines = output_path.read_text(
        encoding="utf-8", errors="replace"
    ).splitlines()

    affinities: list[float] = []
    for line in lines:
        match = _AFFINITY_PATTERN.match(line.strip())
        if match:
            affinities.append(float(match.group(1)))

    if not affinities:
        raise DockingResultImportError(
            f"No parseable Vina affinities were found in: {output_path}"
        )

    model_count = sum(1 for line in lines if line.startswith("MODEL"))
    end_model_count = sum(1 for line in lines if line.startswith("ENDMDL"))
    if model_count == 0:
        model_count = 1
    if end_model_count not in (0, model_count):
        raise DockingResultImportError(
            f"Inconsistent MODEL/ENDMDL records in {output_path}: "
            f"MODEL={model_count}, ENDMDL={end_model_count}."
        )
    if model_count != len(affinities):
        raise DockingResultImportError(
            f"Pose/affinity count mismatch in {output_path}: "
            f"poses={model_count}, affinities={len(affinities)}."
        )

    return model_count, affinities


def _validate_log(log_path: Path) -> None:
    if not log_path.exists() or log_path.stat().st_size == 0:
        raise DockingResultImportError(f"Vina log is missing or empty: {log_path}")
    text = log_path.read_text(encoding="utf-8", errors="replace")
    if "AutoDock Vina" not in text:
        raise DockingResultImportError(
            f"The log does not identify AutoDock Vina: {log_path}"
        )


def _artifact_reference(
    *,
    output_path: Path,
    log_path: Path,
    vina_version: str,
    pdb_id: str,
    pubchem_cid: str,
    best_affinity: float,
    pose_count: int,
    seed: int,
    exhaustiveness: int,
    cpu: int,
    center: tuple[float, float, float],
    size: tuple[float, float, float],
) -> str:
    return (
        f"AutoDock Vina {vina_version}; receptor PDB {pdb_id}; "
        f"ligand PubChem CID {pubchem_cid}; best affinity "
        f"{best_affinity:.3f} kcal/mol; poses {pose_count}; seed {seed}; "
        f"exhaustiveness {exhaustiveness}; CPU {cpu}; "
        f"box center {center[0]:.3f},{center[1]:.3f},{center[2]:.3f}; "
        f"box size {size[0]:.3f},{size[1]:.3f},{size[2]:.3f} A; "
        f"output PDBQT {output_path}; log {log_path}"
    )


def import_docking_result(
    *,
    protein_id: int,
    biomaterial_id: int,
    output_pdbqt_path: str | Path,
    log_path: str | Path,
    vina_version: str = "v1.2.7",
    seed: int = 62024,
    exhaustiveness: int = 8,
    cpu: int = 1,
    center: tuple[float, float, float] = (6.247, 12.577, 20.937),
    size: tuple[float, float, float] = (20.0, 20.0, 20.0),
    interaction_type: str = "AutoDock Vina",
) -> DockingResultImportResult:
    """Import one existing Vina result without rerunning docking."""
    output_path = Path(output_pdbqt_path)
    artifact_log_path = Path(log_path)

    protein = Protein.objects.filter(pk=protein_id).first()
    if protein is None:
        raise DockingResultImportError(f"Protein does not exist: id={protein_id}")
    biomaterial = Biomaterial.objects.filter(pk=biomaterial_id).first()
    if biomaterial is None:
        raise DockingResultImportError(
            f"Biomaterial does not exist: id={biomaterial_id}"
        )

    pdb_id = (protein.pdb_id or "").strip().upper()
    pubchem_cid = (biomaterial.pubchem_cid or "").strip()
    if not pdb_id:
        raise DockingResultImportError(
            f"Protein id={protein_id} has no PDB ID; cannot associate artifact."
        )
    if not pubchem_cid or not pubchem_cid.isdigit():
        raise DockingResultImportError(
            f"Biomaterial id={biomaterial_id} has no numeric PubChem CID; "
            "cannot associate artifact."
        )

    pose_count, affinities = _parse_vina_output(output_path)
    _validate_log(artifact_log_path)
    best_affinity = min(affinities)

    reference = _artifact_reference(
        output_path=output_path,
        log_path=artifact_log_path,
        vina_version=vina_version,
        pdb_id=pdb_id,
        pubchem_cid=pubchem_cid,
        best_affinity=best_affinity,
        pose_count=pose_count,
        seed=seed,
        exhaustiveness=exhaustiveness,
        cpu=cpu,
        center=center,
        size=size,
    )

    with transaction.atomic():
        interaction = Interaction.objects.filter(
            protein=protein,
            biomaterial=biomaterial,
            interaction_type=interaction_type,
            reference=reference,
        ).first()
        created = interaction is None
        if created:
            interaction = Interaction.objects.create(
                protein=protein,
                biomaterial=biomaterial,
                binding_energy=best_affinity,
                docking_score=best_affinity,
                interaction_type=interaction_type,
                reference=reference,
            )

    return DockingResultImportResult(
        interaction=interaction,
        created=created,
        protein_id=protein.id,
        biomaterial_id=biomaterial.id,
        receptor_pdb_id=pdb_id,
        pubchem_cid=pubchem_cid,
        output_pdbqt_path=output_path,
        log_path=artifact_log_path,
        pose_count=pose_count,
        affinities_kcal_per_mol=affinities,
        docking_score=best_affinity,
        binding_energy=None,
    )


import_verified_docking_result = import_docking_result
