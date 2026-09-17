from __future__ import annotations

import math
from typing import Any

from django.db import IntegrityError, transaction

from biomaterials.models import Biomaterial
from interactions.models import DockingJob
from proteins.models import Protein


ACTIVE_JOB_STATES = tuple(DockingJob.ACTIVE_STATUSES)
EXPECTED_FIELDS = {
    "protein_id",
    "biomaterial_id",
    "ligand_type",
    "center_x",
    "center_y",
    "center_z",
    "size_x",
    "size_y",
    "size_z",
}


class DockingRequestError(ValueError):
    pass


def _number(data: dict[str, Any], name: str) -> float:
    value = data.get(name)
    if isinstance(value, bool):
        raise DockingRequestError(f"{name} must be a finite number.")
    try:
        result = float(value)
    except (TypeError, ValueError) as exc:
        raise DockingRequestError(f"{name} must be a finite number.") from exc
    if not math.isfinite(result):
        raise DockingRequestError(f"{name} must be a finite number.")
    return result


def _positive_integer(data: dict[str, Any], name: str) -> int:
    value = data.get(name)
    if isinstance(value, bool):
        raise DockingRequestError(f"{name} must be a positive integer.")
    try:
        result = int(value)
    except (TypeError, ValueError) as exc:
        raise DockingRequestError(f"{name} must be a positive integer.") from exc
    if result <= 0 or str(value).strip() != str(result):
        raise DockingRequestError(f"{name} must be a positive integer.")
    return result


def create_docking_job(
    data: Any,
    owner
) -> DockingJob:
    if not isinstance(data, dict):
        raise DockingRequestError("Docking request body must be a JSON object.")
    unsupported = set(data) - EXPECTED_FIELDS
    missing = EXPECTED_FIELDS - set(data)
    if unsupported:
        raise DockingRequestError("Unsupported docking request field(s).")
    if missing:
        raise DockingRequestError("Missing required docking request field(s).")

    protein_id = _positive_integer(data, "protein_id")
    biomaterial_id = _positive_integer(data, "biomaterial_id")
    box = {name: _number(data, name) for name in ("center_x", "center_y", "center_z", "size_x", "size_y", "size_z")}
    for name in ("center_x", "center_y", "center_z"):
        if abs(box[name]) > 1000:
            raise DockingRequestError(f"{name} must be between -1000 and 1000 Å.")
    for name in ("size_x", "size_y", "size_z"):
        if box[name] <= 0 or box[name] > 100:
            raise DockingRequestError(f"{name} must be greater than 0 and no more than 100 Å.")

    protein = Protein.objects.filter(pk=protein_id).first()
    if protein is None:
        raise DockingRequestError("Protein not found.")
    biomaterial = Biomaterial.objects.filter(pk=biomaterial_id).first()
    if biomaterial is None:
        raise DockingRequestError("Biomaterial not found.")
    if not (protein.pdb_id or "").strip():
        raise DockingRequestError("Selected protein has no PDB ID and is not eligible for docking.")
    if not (biomaterial.pubchem_cid or "").strip().isdigit():
        raise DockingRequestError("Selected biomaterial has no numeric PubChem CID and is not eligible for docking.")
    ligand_type = data.get("ligand_type")
    allowed_types = {
        Biomaterial.ENTITY_TYPE_BIOMATERIAL,
        Biomaterial.ENTITY_TYPE_DRUG,
        Biomaterial.ENTITY_TYPE_SMALL_MOLECULE,
    }
    if ligand_type not in allowed_types:
        raise DockingRequestError("Invalid ligand_type.")
    if biomaterial.entity_type is None:
        raise DockingRequestError("Selected ligand is unclassified and is not eligible for docking.")
    if ligand_type != biomaterial.entity_type:
        raise DockingRequestError("ligand_type does not match the selected ligand classification.")

    try:
        with transaction.atomic():
          return DockingJob.objects.create(
    protein=protein,
    biomaterial=biomaterial,
    owner=owner,

    center_x=box["center_x"],
    center_y=box["center_y"],
    center_z=box["center_z"],

    size_x=box["size_x"],
    size_y=box["size_y"],
    size_z=box["size_z"],

    attempt_count=0,
    failure_stage="",
    worker_token=None,
    lease_expires_at=None,
    last_heartbeat_at=None,
)
    except IntegrityError as exc:
        raise DockingRequestError(
            "An active docking job already exists for this Protein and Biomaterial pair."
        ) from exc
