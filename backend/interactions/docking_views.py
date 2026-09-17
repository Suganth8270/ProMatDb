from __future__ import annotations

import re
from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated

from api.throttles import DockingStatusThrottle, DockingSubmitThrottle, WorkerHealthThrottle

from .models import DockingJob
from .services.docking_workflow import DockingRequestError, create_docking_job


_ACTIVE = set(DockingJob.ACTIVE_STATUSES)
_PATH_RE = re.compile(r"(?i)(?:[A-Za-z]:[\\/]|/)[^\s,;]+")
_TOKEN_RE = re.compile(r"(?i)\b[0-9a-f]{8}-[0-9a-f-]{27,36}\b")



def _stage15c_throttle_scope(scope):
    """Expose the approved scope to DRF ScopedRateThrottle."""
    def decorator(view):
        view.throttle_scope = scope
        view.cls.throttle_scope = scope
        return view
    return decorator

def _safe_error(value: str) -> str:
    text = (value or "").strip()
    text = _TOKEN_RE.sub("[redacted token]", text)
    text = _PATH_RE.sub("[redacted path]", text)
    return text[:500]


def _lease_health(job: DockingJob) -> str:
    if job.status in {DockingJob.STATUS_COMPLETED, DockingJob.STATUS_FAILED}:
        return "terminal"
    if job.last_heartbeat_at is None or job.lease_expires_at is None:
        return "not_observed"
    return "healthy" if job.lease_expires_at >= timezone.now() else "stale"


def _payload(job: DockingJob) -> dict:
    result = None
    if job.interaction_id:
        result = {
            "interaction_url": f"/api/interactions/{job.interaction_id}/",
            "artifact_metadata_url": f"/api/interactions/{job.interaction_id}/artifacts/metadata/",
        }
    return {
        "id": str(job.id),
        "status": job.status,
        "protein": {"id": job.protein_id, "protein_name": job.protein.protein_name, "pdb_id": job.protein.pdb_id},
        "biomaterial": {"id": job.biomaterial_id, "name": job.biomaterial.name, "pubchem_cid": job.biomaterial.pubchem_cid},
        "box": {name: getattr(job, name) for name in ("center_x", "center_y", "center_z", "size_x", "size_y", "size_z")},
        "error_message": _safe_error(job.error_message) if job.error_message else None,
        "failure_stage": job.failure_stage or None,
        "attempt_count": job.attempt_count,
        "last_heartbeat_at": job.last_heartbeat_at,
        "lease_expires_at": job.lease_expires_at,
        "lease_health": _lease_health(job),
        "interaction_id": job.interaction_id,
        "created_at": job.created_at,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "result": result,
    }


@_stage15c_throttle_scope("docking_submit")
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([DockingSubmitThrottle])
def submit_docking_job(request):
    try:
        job = create_docking_job(
            request.data,
            request.user
        )
    except DockingRequestError as exc:
        status = 409 if "already exists" in str(exc) else 400
        return JsonResponse({"error": str(exc)}, status=status)
    return JsonResponse(_payload(job), status=202)


@_stage15c_throttle_scope("docking_status")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([DockingStatusThrottle])
def docking_job_status(request, job_id):
    try:
        job = DockingJob.objects.select_related("protein", "biomaterial").get(
            pk=job_id, owner=request.user
        )
    except DockingJob.DoesNotExist:
        return JsonResponse({"error": "Docking job not found."}, status=404)
    return JsonResponse(_payload(job))


@_stage15c_throttle_scope("worker_health")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([WorkerHealthThrottle])
def docking_worker_health(request):
    now = timezone.now()
    active = DockingJob.objects.filter(status__in=DockingJob.ACTIVE_STATUSES)
    queued_count = DockingJob.objects.filter(status=DockingJob.STATUS_QUEUED).count()
    active_count = active.exclude(status=DockingJob.STATUS_QUEUED).count()
    observed = active.filter(last_heartbeat_at__isnull=False, lease_expires_at__isnull=False)
    stale = observed.filter(lease_expires_at__lt=now).exists()
    recent = observed.filter(last_heartbeat_at__gte=now - timedelta(seconds=30)).exists()
    if stale:
        status = "stale"
    elif recent:
        status = "healthy"
    elif active_count == 0 and queued_count == 0:
        status = "idle"
    else:
        status = "not_observed"
    return JsonResponse({"status": status, "queued_count": queued_count, "active_count": active_count})
