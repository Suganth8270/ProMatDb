from __future__ import annotations

from django.http import FileResponse, Http404, JsonResponse
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated

from api.throttles import ArtifactReadThrottle

from interactions.models import Interaction, DockingJob
from interactions.services.docking_artifacts import (
    DockingArtifactUnavailable,
    ensure_sdf_artifact,
    get_artifact_path,
    get_docking_artifacts,
)



def _stage15c_throttle_scope(scope):
    """Expose the approved scope to DRF ScopedRateThrottle."""
    def decorator(view):
        view.throttle_scope = scope
        view.cls.throttle_scope = scope
        return view
    return decorator

def _authorized_interaction(request, pk: int) -> Interaction:
    try:
        return Interaction.objects.select_related("protein", "biomaterial").filter(
            pk=pk, docking_jobs__owner=request.user
        ).get()
    except Interaction.DoesNotExist as exc:
        raise Http404("Interaction not found") from exc


@_stage15c_throttle_scope("artifact_read")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([ArtifactReadThrottle])
def docking_artifact_metadata(request, pk: int):
    """Return read-only pose/affinity metadata for one Interaction."""
    try:
        interaction = _authorized_interaction(request, pk)
    except Interaction.DoesNotExist as exc:
        raise Http404("Interaction not found") from exc

    try:
        metadata = get_docking_artifacts(interaction, attempt_sdf=True)
    except DockingArtifactUnavailable as exc:
        return JsonResponse({"error": str(exc)}, status=404)
    return JsonResponse(metadata)


@_stage15c_throttle_scope("artifact_read")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([ArtifactReadThrottle])
def docking_artifact_file(request, pk: int, artifact_type: str):
    """Serve one allowlisted artifact; never accepts a filesystem path."""
    try:
        interaction = _authorized_interaction(request, pk)
    except Interaction.DoesNotExist as exc:
        raise Http404("Interaction not found") from exc

    try:
        if artifact_type == "sdf":
            path = ensure_sdf_artifact(interaction)
            content_type = "chemical/x-mdl-sdfile"
        else:
            path = get_artifact_path(interaction, artifact_type)
            content_type = {
                "pdbqt": "text/plain",
                "log": "text/plain",
            }.get(artifact_type, "application/octet-stream")
    except DockingArtifactUnavailable as exc:
        return JsonResponse({"error": str(exc)}, status=404)

    response = FileResponse(
        path.open("rb"),
        as_attachment=True,
        filename=path.name,
        content_type=content_type,
    )
    response["X-Content-Type-Options"] = "nosniff"
    return response
