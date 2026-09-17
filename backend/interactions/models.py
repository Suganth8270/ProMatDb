import uuid

from django.db import models
from proteins.models import Protein
from biomaterials.models import Biomaterial


class Interaction(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE)
    biomaterial = models.ForeignKey(Biomaterial, on_delete=models.CASCADE)
    binding_energy = models.FloatField(null=True, blank=True)
    docking_score = models.FloatField()
    interaction_type = models.CharField(max_length=100)
    reference = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.protein} - {self.biomaterial}"


class DockingJob(models.Model):
    STATUS_QUEUED = "queued"
    STATUS_PREPARING_RECEPTOR = "preparing_receptor"
    STATUS_PREPARING_LIGAND = "preparing_ligand"
    STATUS_DOCKING = "docking"
    STATUS_IMPORTING = "importing"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"

    ACTIVE_STATUSES = (
        STATUS_QUEUED,
        STATUS_PREPARING_RECEPTOR,
        STATUS_PREPARING_LIGAND,
        STATUS_DOCKING,
        STATUS_IMPORTING,
    )

    STATUS_CHOICES = (
        (STATUS_QUEUED, "Queued"),
        (STATUS_PREPARING_RECEPTOR, "Preparing receptor"),
        (STATUS_PREPARING_LIGAND, "Preparing ligand"),
        (STATUS_DOCKING, "Docking"),
        (STATUS_IMPORTING, "Importing result"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    )

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    protein = models.ForeignKey(
        "proteins.Protein",
        on_delete=models.CASCADE,
        related_name="docking_jobs"
    )

    biomaterial = models.ForeignKey(
        "biomaterials.Biomaterial",
        on_delete=models.CASCADE,
        related_name="docking_jobs"
    )

    owner = models.ForeignKey(
        "auth.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="docking_jobs",
    )

    interaction = models.ForeignKey(
        "interactions.Interaction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="docking_jobs",
    )

    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_QUEUED
    )

    center_x = models.FloatField()
    center_y = models.FloatField()
    center_z = models.FloatField()

    size_x = models.FloatField()
    size_y = models.FloatField()
    size_z = models.FloatField()

    attempt_count = models.PositiveIntegerField(default=0)

    worker_token = models.UUIDField(
        null=True,
        blank=True,
        editable=False
    )

    lease_expires_at = models.DateTimeField(null=True, blank=True)
    last_heartbeat_at = models.DateTimeField(null=True, blank=True)

    failure_stage = models.CharField(
        max_length=64,
        blank=True,
        default=""
    )

    error_message = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                condition=models.Q(
                    status__in=[
                        "queued",
                        "preparing_receptor",
                        "preparing_ligand",
                        "docking",
                        "importing"
                    ]
                ),
                fields=("protein", "biomaterial"),
                name="unique_active_docking_pair",
            )
        ]

    def __str__(self):
        return f"{self.protein_id}:{self.biomaterial_id} ({self.status})"