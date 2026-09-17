"""

Receptor preparation service for real AutoDock Vina docking.

Scope (ProMatDB Step 6B): RECEPTOR PREPARATION ONLY.
    Protein PDB ID -> real RCSB coordinate file -> cleaned PDB -> PDBQT receptor

This module intentionally does NOT:
    - run any docking calculation
    - touch ligand/biomaterial preparation
    - write to any Django model (no DockingJob, no Interaction changes)
    - modify any existing API, view, serializer, or URL

It mirrors the existing project convention of a `services` module fetching
external scientific data (see biomaterials/services/pubchem.py), and is
meant to be called either from a Django management command (for now) or,
in a later step, from an async task.

Preparation tool: Meeko (`mk_prepare_receptor.py`), invoked as a subprocess
with an explicit argument list (never shell=True) per project security
guidance. Meeko is the modern, actively maintained successor to the old
AutoDockTools `prepare_receptor4.py` script and is already installed in
this environment.
"""

from __future__ import annotations

import re
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import requests
from django.conf import settings

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

# Same 4-character alphanumeric PDB ID validation already used on the
# frontend (see MolViewer.tsx: /^[A-Za-z0-9]{4}$/), kept consistent here.
PDB_ID_PATTERN = re.compile(r"^[A-Za-z0-9]{4}$")

RCSB_PDB_DOWNLOAD_URL = "https://files.rcsb.org/download/{pdb_id}.pdb"

REQUEST_TIMEOUT_SECONDS = 30
SUBPROCESS_TIMEOUT_SECONDS = 120

# Meeko's receptor-prep CLI is installed by pip as a console-script entry
# point. On Linux/macOS this is typically a `.py`-suffixed (or extension-
# less) script on PATH; on Windows, pip generates a `.exe` wrapper in
# venv\Scripts\ instead, with no `.py` file present at all. Both are the
# same tool -- only the filename differs by platform -- so resolution tries
# each candidate in order rather than assuming one fixed name.
_MEEKO_RECEPTOR_PREP_CANDIDATES = (
    "mk_prepare_receptor.py",   # common on Linux/macOS
    "mk_prepare_receptor",      # extension-less entry point; on Windows,
                                 # shutil.which() resolves this against
                                 # PATHEXT (.EXE, etc.) automatically
    "mk_prepare_receptor.exe",  # explicit Windows console-script wrapper
)


def _resolve_meeko_receptor_executable() -> Optional[str]:
    """
    Return the first available Meeko receptor-prep executable found on
    PATH, trying each cross-platform candidate name in order. Returns None
    if none are found.
    """
    for candidate in _MEEKO_RECEPTOR_PREP_CANDIDATES:
        found = shutil.which(candidate)
        if found:
            return found
    return None

# No MEDIA_ROOT is configured in settings.py yet (confirmed during Step 6A
# inspection). Rather than silently modifying settings.py, receptor files
# are written under a clearly-named subdirectory of BASE_DIR, which already
# exists as a setting. Formalizing this under MEDIA_ROOT is a later-step
# decision (see Step 6.1 roadmap, item 6.5+), not part of 6B.
DEFAULT_OUTPUT_DIR = Path(settings.BASE_DIR) / "docking_data" / "receptors"

# Known AutoDock 4 / Vina atom types that Meeko's PDBQT output uses.
# Used only for a lightweight sanity check of the produced file, not for
# any scientific computation.
_KNOWN_PDBQT_ATOM_TYPES = {
    "A", "C", "N", "NA", "OA", "SA", "S", "H", "HD", "HS", "P",
    "F", "Cl", "CL", "Br", "BR", "I", "Zn", "ZN", "Fe", "FE",
    "Mg", "MG", "Mn", "MN", "Ca", "CA", "Cu", "CU", "Na", "NA2",
}


class ReceptorPreparationError(Exception):
    """Raised for any failure in the receptor download/preparation pipeline."""


@dataclass
class ReceptorPreparationResult:
    pdb_id: str
    source_pdb_path: Path
    cleaned_pdb_path: Path
    pdbqt_path: Path
    atom_count: int
    heteroatom_records_removed: int
    alternate_location_records_removed: int = 0
    warnings: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "pdb_id": self.pdb_id,
            "source_pdb_path": str(self.source_pdb_path),
            "cleaned_pdb_path": str(self.cleaned_pdb_path),
            "pdbqt_path": str(self.pdbqt_path),
            "atom_count": self.atom_count,
            "heteroatom_records_removed": self.heteroatom_records_removed,
            "alternate_location_records_removed": self.alternate_location_records_removed,
            "warnings": self.warnings,
        }


def _validate_pdb_id(pdb_id: str) -> str:
    pdb_id = (pdb_id or "").strip()
    if not PDB_ID_PATTERN.match(pdb_id):
        raise ReceptorPreparationError(
            f'"{pdb_id}" is not a valid 4-character PDB ID.'
        )
    return pdb_id.upper()


def fetch_pdb_structure(pdb_id: str, dest_dir: Path) -> Path:
    """
    Download the real coordinate file for `pdb_id` from RCSB, as plain-text
    PDB format (distinct from the binary bCIF format the frontend's Mol*
    viewer uses for in-browser rendering — Meeko needs text PDB or mmCIF).

    Raises ReceptorPreparationError on any network failure, non-200
    response, or a response that doesn't look like a real PDB file.
    """
    pdb_id = _validate_pdb_id(pdb_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / f"{pdb_id}.pdb"

    url = RCSB_PDB_DOWNLOAD_URL.format(pdb_id=pdb_id.lower())

    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    except requests.RequestException as exc:
        raise ReceptorPreparationError(
            f"Failed to reach RCSB for PDB ID {pdb_id}: {exc}"
        ) from exc

    if response.status_code != 200:
        raise ReceptorPreparationError(
            f"RCSB returned status {response.status_code} for PDB ID "
            f"{pdb_id}. It may not exist or may not have a downloadable "
            f"coordinate file."
        )

    text = response.text
    if "ATOM" not in text and "HETATM" not in text:
        raise ReceptorPreparationError(
            f"Response for PDB ID {pdb_id} does not look like a valid PDB "
            f"coordinate file (no ATOM/HETATM records found)."
        )

    dest_path.write_text(text, encoding="utf-8")
    return dest_path




def _clean_pdb_for_receptor_prep(
    pdb_path: Path,
    output_path: Path
) -> tuple[int, int]:
    """
    Clean a PDB file for receptor preparation.

    Keeps only the first MODEL when multiple models are present.
    Removes HETATM and ANISOU records.
    Keeps only primary alternate locations.
    """

    removed_hetatm = 0
    removed_altloc = 0
    kept_lines = []

    inside_first_model = True
    model_seen = False

    lines = pdb_path.read_text(
        encoding="utf-8",
        errors="replace"
    ).splitlines()

    for line in lines:

        record = line[:6].strip()

        # Handle multiple structural models
        if record == "MODEL":

            if model_seen:
                break

            model_seen = True
            inside_first_model = True
            continue

        if record == "ENDMDL":

            if model_seen:
                break

        if not inside_first_model:
            continue

        # Remove heteroatoms and ANISOU records
        if record in ("HETATM", "ANISOU"):
            removed_hetatm += 1
            continue

        # Process ATOM records
        if record == "ATOM":

            alt_loc = line[16] if len(line) > 16 else " "

            # Keep blank or A alternate location
            if alt_loc not in (" ", "A"):
                removed_altloc += 1
                continue

            # Replace altLoc A with blank
            if alt_loc == "A":
                line = line[:16] + " " + line[17:]

        kept_lines.append(line)

    output_path.write_text(
        "\n".join(kept_lines) + "\n",
        encoding="utf-8"
    )

    return removed_hetatm, removed_altloc

def _run_meeko_receptor_prep(
    cleaned_pdb_path: Path,
    output_dir: Path,
    basename: str,
) -> tuple[Path, str]:

    executable = _resolve_meeko_receptor_executable()

    if not executable:
        raise ReceptorPreparationError(
            "Meeko's receptor preparation tool could not be found on PATH. "
            "Tried: "
            + ", ".join(_MEEKO_RECEPTOR_PREP_CANDIDATES)
            + ". Install it with: pip install meeko"
        )

    output_basename_path = output_dir / basename

    pdbqt_path = output_dir / f"{basename}.pdbqt"

    command = [
    executable,
    "--read_pdb",
    str(cleaned_pdb_path),
    "-o",
    str(output_dir / basename),
    "-p",
    str(pdbqt_path),
    "--allow_bad_res",
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
        raise ReceptorPreparationError(
            f"Receptor preparation timed out after "
            f"{SUBPROCESS_TIMEOUT_SECONDS}s."
        ) from exc

    if result.returncode != 0:
        raise ReceptorPreparationError(
            "Meeko receptor preparation failed:\n"
            f"stdout: {result.stdout.strip()}\n"
            f"stderr: {result.stderr.strip()}"
        )

    pdbqt_path = output_dir / f"{basename}.pdbqt"

    if not pdbqt_path.exists():
        raise ReceptorPreparationError(
            "Meeko reported success but no .pdbqt file was produced at "
            f"the expected path: {pdbqt_path}"
        )

    meeko_output = f"{result.stdout}\n{result.stderr}"

    return pdbqt_path, meeko_output

def _validate_pdbqt(pdbqt_path: Path) -> tuple[int, list[str]]:
    """
    Lightweight structural sanity check of the produced PDBQT file.
    Does not attempt to fully validate chemistry; just confirms the file is
    non-empty, contains ATOM records, and those records use recognizable
    AutoDock atom types in the expected column.

    Returns (atom_count, warnings).
    """
    if not pdbqt_path.exists() or pdbqt_path.stat().st_size == 0:
        raise ReceptorPreparationError(
            f"Produced PDBQT file is missing or empty: {pdbqt_path}"
        )

    warnings: list[str] = []
    atom_count = 0
    unrecognized_types: set[str] = set()

    for line in pdbqt_path.read_text(encoding="utf-8", errors="replace").splitlines():
        if line.startswith("ATOM") or line.startswith("HETATM"):
            atom_count += 1
            parts = line.split()
            if parts:
                atom_type = parts[-1]
                if atom_type not in _KNOWN_PDBQT_ATOM_TYPES:
                    unrecognized_types.add(atom_type)

    if atom_count == 0:
        raise ReceptorPreparationError(
            f"Produced PDBQT file contains no ATOM/HETATM records: {pdbqt_path}"
        )

    if unrecognized_types:
        warnings.append(
            "Encountered PDBQT atom types not in the known reference set "
            f"(may still be valid, review manually): {sorted(unrecognized_types)}"
        )

    return atom_count, warnings


def prepare_receptor(pdb_id: str, output_dir: Optional[Path] = None) -> ReceptorPreparationResult:
    """
    Full receptor preparation pipeline for a single protein:

        real PDB ID -> RCSB download -> strip waters/heteroatoms
                     -> Meeko PDBQT conversion -> validated result

    Does not invoke Vina, does not touch any biomaterial/ligand, and does
    not write to any Django model.
    """
    pdb_id = _validate_pdb_id(pdb_id)
    output_dir = Path(output_dir) if output_dir else DEFAULT_OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    source_pdb_path = fetch_pdb_structure(pdb_id, output_dir)

    cleaned_pdb_path = output_dir / f"{pdb_id}_cleaned.pdb"
    heteroatoms_removed, altloc_removed = _clean_pdb_for_receptor_prep(
        source_pdb_path, cleaned_pdb_path
    )

    basename = f"{pdb_id}_receptor"
    pdbqt_path, meeko_output = _run_meeko_receptor_prep(cleaned_pdb_path, output_dir, basename)

    atom_count, warnings = _validate_pdbqt(pdbqt_path)

    if altloc_removed:
        warnings.append(
            f"{altloc_removed} alternate-location (altLoc) atom record(s) "
            "were dropped, keeping only the primary/highest-occupancy "
            "conformer for each affected atom."
        )

    # --allow_bad_res lets Meeko continue past residues it can't template-
    # match instead of crashing, but it can silently skip those residues.
    # Surface anything Meeko itself reported about skipped/bad residues so
    # this is never silent (per Step 6B requirement 9/13).
    for line in meeko_output.splitlines():
        lowered = line.lower()
        if any(kw in lowered for kw in ("skip", "bad_res", "ignor", "could not", "unable to")):
            stripped = line.strip()
            if stripped and stripped not in warnings:
                warnings.append(f"Meeko: {stripped}")

    return ReceptorPreparationResult(
        pdb_id=pdb_id,
        source_pdb_path=source_pdb_path,
        cleaned_pdb_path=cleaned_pdb_path,
        pdbqt_path=pdbqt_path,
        atom_count=atom_count,
        heteroatom_records_removed=heteroatoms_removed,
        alternate_location_records_removed=altloc_removed,
        warnings=warnings,
    )