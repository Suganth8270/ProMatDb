from __future__ import annotations

import threading
import time
import uuid
from datetime import timedelta
from pathlib import Path
from typing import Any

from django.conf import settings
from django.db import close_old_connections, transaction
from django.db.models import Q
from django.utils import timezone

from biomaterials.services.ligand_prep import prepare_ligand
from interactions.models import DockingJob
from interactions.services.docking_result_import import import_docking_result
from interactions.services.receptor_preparation_adapter import prepare_receptor
from proteins.services.docking_run import DockingBox, run_docking


JOB_TIMEOUT_SECONDS = 900
LEASE_SECONDS = 120
HEARTBEAT_INTERVAL_SECONDS = 2
POLL_INTERVAL_SECONDS = 2


class DockingWorkerError(RuntimeError):
    pass


class WorkerOwnershipLost(DockingWorkerError):
    pass


def _artifact_root(job_id: uuid.UUID, attempt_count: int) -> Path:
    return (
        Path(settings.BASE_DIR)
        / "docking_data"
        / "docking_jobs"
        / str(job_id)
        / f"attempt-{attempt_count}"
    )


def _lease_values(now):
    return {"last_heartbeat_at": now, "lease_expires_at": now + timedelta(seconds=LEASE_SECONDS)}


def recover_stale_jobs() -> int:
    now = timezone.now()
    updated = DockingJob.objects.filter(
        status__in=DockingJob.ACTIVE_STATUSES,
        lease_expires_at__isnull=False,
        lease_expires_at__lt=now,
    ).update(
        status=DockingJob.STATUS_FAILED,
        failure_stage="worker",
        error_message="Worker lease expired before the job completed.",
        finished_at=now,
        worker_token=None,
        lease_expires_at=None,
    )
    return updated


def claim_next_job() -> tuple[DockingJob, uuid.UUID] | None:
    now = timezone.now()
    with transaction.atomic():
        job = (
            DockingJob.objects.select_for_update()
            .filter(status=DockingJob.STATUS_QUEUED)
            .order_by("created_at")
            .first()
        )
        if job is None:
            return None
        token = uuid.uuid4()
        job.attempt_count += 1
        job.worker_token = token
        job.status = DockingJob.STATUS_PREPARING_RECEPTOR
        job.started_at = job.started_at or now
        job.failure_stage = ""
        job.error_message = ""
        job.finished_at = None
        for field, value in _lease_values(now).items():
            setattr(job, field, value)
        job.save(update_fields=[
            "attempt_count", "worker_token", "status", "started_at", "failure_stage",
            "error_message", "finished_at", "last_heartbeat_at", "lease_expires_at",
        ])
    return job, token


def _heartbeat(job_id, token, stop_event: threading.Event) -> None:
    while not stop_event.wait(HEARTBEAT_INTERVAL_SECONDS):
        close_old_connections()
        now = timezone.now()
        DockingJob.objects.filter(
            pk=job_id,
            worker_token=token,
            status__in=DockingJob.ACTIVE_STATUSES,
        ).update(**_lease_values(now))


def _owned_update(job_id, token, **changes) -> None:
    now = timezone.now()
    changes.update(_lease_values(now))
    updated = DockingJob.objects.filter(
        pk=job_id,
        worker_token=token,
        status__in=DockingJob.ACTIVE_STATUSES,
    ).update(**changes)
    if updated != 1:
        raise WorkerOwnershipLost("Worker ownership was lost while processing the docking job.")


def _finish(job_id, token, *, interaction_id: int) -> None:
    now = timezone.now()
    updated = DockingJob.objects.filter(pk=job_id, worker_token=token).update(
        status=DockingJob.STATUS_COMPLETED,
        interaction_id=interaction_id,
        finished_at=now,
        last_heartbeat_at=now,
        lease_expires_at=None,
        worker_token=None,
        failure_stage="",
        error_message="",
    )
    if updated != 1:
        raise WorkerOwnershipLost("Worker ownership was lost before completion.")


def _fail(job_id, token, stage: str, exc: BaseException) -> bool:
    safe_message = str(exc).strip() or exc.__class__.__name__
    if len(safe_message) > 500:
        safe_message = safe_message[:500]
    now = timezone.now()
    updated = DockingJob.objects.filter(
        pk=job_id,
        worker_token=token,
        status__in=DockingJob.ACTIVE_STATUSES,
    ).update(
        status=DockingJob.STATUS_FAILED,
        failure_stage=stage[:64],
        error_message=safe_message,
        finished_at=now,
        last_heartbeat_at=now,
        lease_expires_at=None,
        worker_token=None,
    )
    return updated == 1


def process_one_job(job: DockingJob, token: uuid.UUID | None = None) -> DockingJob:
    token = token or job.worker_token
    if token is None:
        raise DockingWorkerError("A claimed job requires a worker ownership token.")
    deadline = time.monotonic() + JOB_TIMEOUT_SECONDS
    stop_event = threading.Event()
    heartbeat = threading.Thread(
        target=_heartbeat, args=(job.pk, token, stop_event), daemon=True
    )
    heartbeat.start()
    attempt_root = _artifact_root(job.pk, job.attempt_count)
    receptor_dir = attempt_root / "receptor"
    ligand_dir = attempt_root / "ligand"
    docking_dir = attempt_root / "docking"
    try:
        def check_deadline():
            if time.monotonic() >= deadline:
                raise TimeoutError("Docking job exceeded the server-side time limit.")

        check_deadline()
        receptor_dir.mkdir(parents=True, exist_ok=True)
        receptor_result = prepare_receptor(job.protein.pdb_id, output_dir=receptor_dir)
        _owned_update(job.pk, token, status=DockingJob.STATUS_PREPARING_LIGAND)

        check_deadline()
        ligand_dir.mkdir(parents=True, exist_ok=True)
        ligand_result = prepare_ligand(job.biomaterial.pubchem_cid, output_dir=ligand_dir)
        _owned_update(job.pk, token, status=DockingJob.STATUS_DOCKING)

        check_deadline()
        docking_dir.mkdir(parents=True, exist_ok=True)
        docking_result = run_docking(
            receptor_result.pdbqt_path,
            ligand_result.pdbqt_path,
            output_dir=docking_dir,
            box=DockingBox(
                center_x=job.center_x,
                center_y=job.center_y,
                center_z=job.center_z,
                size_x=job.size_x,
                size_y=job.size_y,
                size_z=job.size_z,
            ),
        )
        _owned_update(job.pk, token, status=DockingJob.STATUS_IMPORTING)

        check_deadline()
        imported = import_docking_result(
            protein_id=job.protein_id,
            biomaterial_id=job.biomaterial_id,
            output_pdbqt_path=docking_result.output_pdbqt_path,
            log_path=docking_result.log_path,
            vina_version=docking_result.vina_version,
        )
        _finish(job.pk, token, interaction_id=imported.interaction.id)
    except WorkerOwnershipLost:
        raise
    except TimeoutError as exc:
        _fail(job.pk, token, "timeout", exc)
    except Exception as exc:  # scientific services provide the detailed validation error
        stage = {
            DockingJob.STATUS_PREPARING_RECEPTOR: "preparing_receptor",
            DockingJob.STATUS_PREPARING_LIGAND: "preparing_ligand",
            DockingJob.STATUS_DOCKING: "docking",
            DockingJob.STATUS_IMPORTING: "importing",
        }.get(DockingJob.objects.filter(pk=job.pk).values_list("status", flat=True).first(), "worker")
        _fail(job.pk, token, stage, exc)
    finally:
        stop_event.set()
        heartbeat.join(timeout=5)
        close_old_connections()
    return DockingJob.objects.get(pk=job.pk)


def process_next_job() -> DockingJob | None:
    recover_stale_jobs()
    claimed = claim_next_job()
    if claimed is None:
        return None
    job, token = claimed
    return process_one_job(job, token)
