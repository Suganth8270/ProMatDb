from django.urls import path
from .artifact_views import docking_artifact_file, docking_artifact_metadata
from .docking_views import docking_job_status, docking_worker_health, submit_docking_job
from .views import (
    interaction_list,
    interaction_detail,
    protein_interactions,
    biomaterial_interactions,
)
urlpatterns = [
    path("docking-worker/health/", docking_worker_health, name="docking-worker-health"),
    path("docking-jobs/", submit_docking_job, name="docking-job-submit"),
    path("docking-jobs/<uuid:job_id>/", docking_job_status, name="docking-job-status"),
    path("<int:pk>/artifacts/metadata/", docking_artifact_metadata, name="docking-artifact-metadata"),
    path("<int:pk>/artifacts/<str:artifact_type>/", docking_artifact_file, name="docking-artifact-file"),
   path("", interaction_list, name="interaction-list"),
path("<int:pk>/", interaction_detail, name="interaction-detail"),

    path(
        "proteins/<int:protein_id>/interactions/",
        protein_interactions,
        name="protein-interactions",
    ),

    path(
        "biomaterials/<int:biomaterial_id>/interactions/",
        biomaterial_interactions,
        name="biomaterial-interactions",
    ),
]