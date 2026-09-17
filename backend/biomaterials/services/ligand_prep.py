"""
Strict real PubChem 3D SDF -> Meeko ligand PDBQT preparation.

Step 6C scope:
    PubChem CID -> real PubChem 3D SDF -> validated ligand PDBQT

This module intentionally does not:
    - modify Biomaterial records or any database model
    - add API endpoints or URL routes
    - generate docking scores
    - generate 3D coordinates when PubChem does not provide them
    - invoke AutoDock Vina or any docking calculation
"""

from __future__ import annotations

import math
import re
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import requests
from django.conf import settings
from rdkit import Chem


BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
REQUEST_TIMEOUT_SECONDS = 30
SUBPROCESS_TIMEOUT_SECONDS = 120
CID_PATTERN = re.compile(r"^[0-9]+$")

# Keep this local to the ligand service. The receptor resolver must remain
# unchanged; this resolver follows the same Windows .EXE strategy.
_MEEKO_LIGAND_PREP_CANDIDATES = (
    "mk_prepare_ligand.py",
    "mk_prepare_ligand",
    "mk_prepare_ligand.exe",
)

DEFAULT_OUTPUT_DIR = Path(settings.BASE_DIR) / "docking_data" / "ligands"

# AutoDock4/Vina atom types commonly emitted by Meeko for small-molecule
# ligands. Unknown types are rejected rather than silently accepted.
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


class LigandPreparationError(Exception):
    """Raised when real ligand retrieval, preparation, or validation fails."""


@dataclass
class LigandPreparationResult:
    cid: str
    source_sdf_path: Path
    pdbqt_path: Path
    sdf_atom_count: int
    explicit_hydrogen_count: int
    atom_count: int
    warnings: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "cid": self.cid,
            "source_sdf_path": str(self.source_sdf_path),
            "pdbqt_path": str(self.pdbqt_path),
            "sdf_atom_count": self.sdf_atom_count,
            "explicit_hydrogen_count": self.explicit_hydrogen_count,
            "atom_count": self.atom_count,
            "warnings": self.warnings,
        }


def _validate_cid(pubchem_cid: str) -> str:
    """Validate and normalize the existing Biomaterial.pubchem_cid value."""
    cid = str(pubchem_cid or "").strip()
    if not CID_PATTERN.fullmatch(cid) or int(cid) <= 0:
        raise LigandPreparationError(
            f'"{cid}" is not a valid positive PubChem CID.'
        )
    return str(int(cid))


def _resolve_meeko_ligand_executable() -> Optional[str]:
    """Resolve the Meeko ligand CLI, including the Windows .EXE wrapper."""
    for candidate in _MEEKO_LIGAND_PREP_CANDIDATES:
        found = shutil.which(candidate)
        if found:
            return found
    return None


def fetch_pubchem_3d_sdf(pubchem_cid: str, dest_dir: Path) -> Path:
    """Download the real PubChem 3D SDF for an explicit CID."""
    cid = _validate_cid(pubchem_cid)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / f"{cid}.sdf"
    url = f"{BASE_URL}/compound/cid/{cid}/SDF"

    try:
        response = requests.get(
            url,
            params={"record_type": "3d"},
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers={"User-Agent": "ProMatDB-Step6C/1.0"},
        )
    except requests.RequestException as exc:
        raise LigandPreparationError(
            f"Failed to reach PubChem for CID {cid}: {exc}"
        ) from exc

    if response.status_code != 200:
        raise LigandPreparationError(
            f"PubChem did not provide a 3D SDF for CID {cid}; "
            f"HTTP status {response.status_code}."
        )

    content = response.content
    if not content or not content.strip():
        raise LigandPreparationError(f"PubChem returned an empty SDF for CID {cid}.")

    lowered = content[:512].lower()
    if b"<!doctype html" in lowered or b"<html" in lowered:
        raise LigandPreparationError(
            f"PubChem returned HTML instead of an SDF for CID {cid}."
        )
    if b"$$$$" not in content:
        raise LigandPreparationError(
            f"PubChem response for CID {cid} is not a complete SDF record."
        )

    dest_path.write_bytes(content)
    return dest_path


def _validate_3d_sdf(sdf_path: Path) -> tuple[int, int]:
    """
    Validate one real SDF molecule with explicit hydrogens and finite 3D data.

    Coordinates are never generated or altered here. If PubChem does not
    provide a usable 3D conformer, preparation fails explicitly.
    """
    if not sdf_path.exists() or sdf_path.stat().st_size == 0:
        raise LigandPreparationError(f"SDF is missing or empty: {sdf_path}")

    try:
        supplier = Chem.SDMolSupplier(
            str(sdf_path),
            removeHs=False,
            sanitize=True,
            strictParsing=True,
        )
        molecules = [mol for mol in supplier if mol is not None]
    except Exception as exc:
        raise LigandPreparationError(
            f"RDKit could not parse the PubChem SDF {sdf_path}: {exc}"
        ) from exc

    if len(molecules) != 1:
        raise LigandPreparationError(
            f"Expected exactly one molecule in {sdf_path}, found {len(molecules)}."
        )

    mol = molecules[0]
    atom_count = mol.GetNumAtoms()
    if atom_count == 0:
        raise LigandPreparationError(f"SDF contains no atoms: {sdf_path}")

    explicit_hydrogens = sum(
        1 for atom in mol.GetAtoms() if atom.GetAtomicNum() == 1
    )
    if explicit_hydrogens == 0:
        raise LigandPreparationError(
            "PubChem 3D SDF contains no explicit hydrogen atoms; refusing to "
            "invent hydrogens or coordinates."
        )

    if mol.GetNumConformers() != 1:
        raise LigandPreparationError(
            f"Expected exactly one 3D conformer in {sdf_path}, "
            f"found {mol.GetNumConformers()}."
        )

    conformer = mol.GetConformer()
    if not conformer.Is3D():
        raise LigandPreparationError(
            f"SDF conformer is not marked as 3D: {sdf_path}"
        )

    for atom_index in range(atom_count):
        position = conformer.GetAtomPosition(atom_index)
        if not all(
            math.isfinite(value)
            for value in (position.x, position.y, position.z)
        ):
            raise LigandPreparationError(
                f"SDF contains a non-finite coordinate at atom {atom_index + 1}."
            )

    return atom_count, explicit_hydrogens


def _run_meeko_ligand_prep(
    sdf_path: Path, output_dir: Path, cid: str
) -> tuple[Path, str]:
    """Run Meeko with an explicit argument list and no shell execution."""
    executable = _resolve_meeko_ligand_executable()
    if not executable:
        raise LigandPreparationError(
            "Meeko's ligand preparation tool was not found on PATH. Tried: "
            + ", ".join(_MEEKO_LIGAND_PREP_CANDIDATES)
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    pdbqt_path = output_dir / f"{cid}_ligand.pdbqt"
    if pdbqt_path.exists():
        pdbqt_path.unlink()

    command = [
        executable,
        "-i",
        str(sdf_path),
        "-o",
        str(pdbqt_path),
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=SUBPROCESS_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise LigandPreparationError(
            f"Ligand preparation timed out after {SUBPROCESS_TIMEOUT_SECONDS}s."
        ) from exc

    meeko_output = f"{result.stdout}\n{result.stderr}"
    if result.returncode != 0:
        raise LigandPreparationError(
            "Meeko ligand preparation failed:\n"
            f"stdout: {result.stdout.strip()}\n"
            f"stderr: {result.stderr.strip()}"
        )

    if not pdbqt_path.exists():
        raise LigandPreparationError(
            "Meeko reported success but did not create the expected PDBQT: "
            f"{pdbqt_path}"
        )

    return pdbqt_path, meeko_output


def _validate_pdbqt(pdbqt_path: Path) -> tuple[int, list[str]]:
    """Validate real PDBQT atom records, finite coordinates, and atom types."""
    if not pdbqt_path.exists() or pdbqt_path.stat().st_size == 0:
        raise LigandPreparationError(
            f"Produced PDBQT is missing or empty: {pdbqt_path}"
        )

    atom_count = 0
    unknown_types: set[str] = set()
    warnings: list[str] = []

    for line_number, line in enumerate(
        pdbqt_path.read_text(encoding="utf-8", errors="replace").splitlines(),
        start=1,
    ):
        if not (line.startswith("ATOM") or line.startswith("HETATM")):
            continue

        atom_count += 1
        if len(line) < 54:
            raise LigandPreparationError(
                f"PDBQT atom record is too short at line {line_number}."
            )

        try:
            coordinates = tuple(
                float(line[start:start + 8])
                for start in (30, 38, 46)
            )
        except ValueError as exc:
            raise LigandPreparationError(
                f"PDBQT has invalid coordinates at line {line_number}."
            ) from exc

        if not all(math.isfinite(value) for value in coordinates):
            raise LigandPreparationError(
                f"PDBQT has non-finite coordinates at line {line_number}."
            )

        fields = line.split()
        if not fields:
            raise LigandPreparationError(
                f"PDBQT atom record is malformed at line {line_number}."
            )
        unknown_types.add(fields[-1]) if fields[-1] not in _KNOWN_PDBQT_ATOM_TYPES else None

    if atom_count == 0:
        raise LigandPreparationError(
            f"Produced PDBQT contains no ATOM/HETATM records: {pdbqt_path}"
        )

    if unknown_types:
        raise LigandPreparationError(
            "PDBQT contains unrecognized AutoDock atom type(s): "
            + ", ".join(sorted(unknown_types))
        )

    return atom_count, warnings


def prepare_ligand(
    pubchem_cid: str, output_dir: Optional[Path] = None
) -> LigandPreparationResult:
    """
    Prepare one real PubChem CID as a Meeko ligand PDBQT.

    The input is the existing Biomaterial.pubchem_cid value. This function
    writes only files and does not access or modify the database.
    """
    cid = _validate_cid(pubchem_cid)
    output_dir = Path(output_dir) if output_dir else DEFAULT_OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    sdf_path = fetch_pubchem_3d_sdf(cid, output_dir)
    sdf_atom_count, explicit_hydrogen_count = _validate_3d_sdf(sdf_path)
    pdbqt_path, meeko_output = _run_meeko_ligand_prep(
        sdf_path, output_dir, cid
    )
    atom_count, warnings = _validate_pdbqt(pdbqt_path)

    for line in meeko_output.splitlines():
        lowered = line.lower()
        if any(keyword in lowered for keyword in ("warning", "skip", "error")):
            stripped = line.strip()
            if stripped and stripped not in warnings:
                warnings.append(f"Meeko: {stripped}")

    return LigandPreparationResult(
        cid=cid,
        source_sdf_path=sdf_path,
        pdbqt_path=pdbqt_path,
        sdf_atom_count=sdf_atom_count,
        explicit_hydrogen_count=explicit_hydrogen_count,
        atom_count=atom_count,
        warnings=warnings,
    )


# Explicit alias for callers that prefer the pipeline name.
prepare_ligand_from_cid = prepare_ligand
