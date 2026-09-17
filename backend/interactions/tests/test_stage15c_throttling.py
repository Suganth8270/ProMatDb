from functools import wraps
from unittest.mock import patch

from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.settings import api_settings
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle, ScopedRateThrottle

from biomaterials.models import Biomaterial
from interactions.models import DockingJob, Interaction
from proteins.models import Protein


BASE_RATES = {
    "docking_submit": "3/hour",
    "docking_status": "120/minute",
    "worker_health": "30/minute",
    "artifact_read": "60/minute",
    "biomaterial_mutation": "20/hour",
    "protein_mutation": "20/hour",
}


def synchronize_throttle_rates(test_function):
    """Use override_settings rates for this test, then restore DRF's cache."""
    @wraps(test_function)
    def wrapper(*args, **kwargs):
        simple_original = SimpleRateThrottle.THROTTLE_RATES
        scoped_original = getattr(ScopedRateThrottle, "THROTTLE_RATES", simple_original)
        temporary_rates = dict(api_settings.DEFAULT_THROTTLE_RATES)
        SimpleRateThrottle.THROTTLE_RATES = temporary_rates
        ScopedRateThrottle.THROTTLE_RATES = temporary_rates
        try:
            return test_function(*args, **kwargs)
        finally:
            SimpleRateThrottle.THROTTLE_RATES = simple_original
            ScopedRateThrottle.THROTTLE_RATES = scoped_original
    return wrapper


class Stage15CThrottleTests(TestCase):
    def setUp(self):
        User = __import__("django.contrib.auth", fromlist=["get_user_model"]).get_user_model()
        self.user_a = User.objects.create_user(username="stage15c-a", password="safe-password-a")
        self.user_b = User.objects.create_user(username="stage15c-b", password="safe-password-b")
        self.client = APIClient()
        cache.clear()

    def tearDown(self):
        cache.clear()
        super().tearDown()

    def payload_for(self, index):
        protein = Protein.objects.create(
            protein_name=f"Throttle protein {index}",
            pdb_id=f"1A{index:02d}",
            uniprot_id=f"THR{index:04d}",
            sequence="ACD",
        )
        ligand = Biomaterial.objects.create(
            name=f"Throttle ligand {index}",
            pubchem_cid=str(999100 + index),
            entity_type="biomaterial",
        )
        return {
            "protein_id": protein.id,
            "biomaterial_id": ligand.id,
            "ligand_type": "biomaterial",
            "center_x": 1,
            "center_y": 2,
            "center_z": 3,
            "size_x": 20,
            "size_y": 20,
            "size_z": 20,
        }, protein, ligand

    def make_job(self, owner):
        payload, protein, ligand = self.payload_for(80 + owner.id)
        return DockingJob.objects.create(
            owner=owner,
            protein=protein,
            biomaterial=ligand,
            status=DockingJob.STATUS_QUEUED,
            **{key: payload[key] for key in ("center_x", "center_y", "center_z", "size_x", "size_y", "size_z")},
        )

    def test_exact_configured_rates(self):
        self.assertEqual(settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], BASE_RATES)

    @override_settings(REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework.authentication.SessionAuthentication",),
        "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
        "DEFAULT_THROTTLE_RATES": {**BASE_RATES, "docking_submit": "2/hour"},
    })
    @synchronize_throttle_rates
    def test_docking_submission_rate_and_user_isolation(self):
        self.client.force_authenticate(self.user_a)
        for index in (1, 2):
            response = self.client.post("/api/interactions/docking-jobs/", self.payload_for(index)[0], format="json")
            self.assertEqual(response.status_code, 202)
        self.assertEqual(self.client.post("/api/interactions/docking-jobs/", self.payload_for(3)[0], format="json").status_code, 429)
        self.client.force_authenticate(self.user_b)
        self.assertEqual(self.client.post("/api/interactions/docking-jobs/", self.payload_for(4)[0], format="json").status_code, 202)

    @override_settings(REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework.authentication.SessionAuthentication",),
        "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
        "DEFAULT_THROTTLE_RATES": {**BASE_RATES, "docking_status": "2/minute", "worker_health": "1/minute"},
    })
    @synchronize_throttle_rates
    def test_status_scope_is_separate_from_worker_health_scope(self):
        job = self.make_job(self.user_a)
        self.client.force_authenticate(self.user_a)
        path = f"/api/interactions/docking-jobs/{job.id}/"
        self.assertEqual(self.client.get(path).status_code, 200)
        self.assertEqual(self.client.get(path).status_code, 200)
        self.assertEqual(self.client.get(path).status_code, 429)
        self.assertEqual(self.client.get("/api/interactions/docking-worker/health/").status_code, 200)
        self.assertEqual(self.client.get("/api/interactions/docking-worker/health/").status_code, 429)

    @override_settings(REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework.authentication.SessionAuthentication",),
        "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
        "DEFAULT_THROTTLE_RATES": {**BASE_RATES, "artifact_read": "2/minute"},
    })
    @synchronize_throttle_rates
    def test_artifact_scope_is_user_scoped(self):
        interaction = Interaction.objects.create(
            protein=self.payload_for(90)[1],
            biomaterial=self.payload_for(91)[2],
            binding_energy=None,
            docking_score=-2.0,
            interaction_type="AutoDock Vina",
            reference="Stage 15C throttle test",
        )
        self.make_job(self.user_a).delete()
        job = DockingJob.objects.create(owner=self.user_a, protein=interaction.protein, biomaterial=interaction.biomaterial, interaction=interaction, status=DockingJob.STATUS_COMPLETED, center_x=1, center_y=2, center_z=3, size_x=20, size_y=20, size_z=20)
        self.client.force_authenticate(self.user_a)
        with patch("interactions.artifact_views.get_docking_artifacts", return_value={"pose_count": 0}):
            self.assertEqual(self.client.get(f"/api/interactions/{interaction.id}/artifacts/metadata/").status_code, 200)
            self.assertEqual(self.client.get(f"/api/interactions/{interaction.id}/artifacts/metadata/").status_code, 200)
            self.assertEqual(self.client.get(f"/api/interactions/{interaction.id}/artifacts/metadata/").status_code, 429)
        self.assertEqual(job.owner_id, self.user_a.id)

    @override_settings(REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework.authentication.SessionAuthentication",),
        "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.ScopedRateThrottle",),
        "DEFAULT_THROTTLE_RATES": {**BASE_RATES, "biomaterial_mutation": "1/minute", "protein_mutation": "1/minute"},
    })
    @synchronize_throttle_rates
    def test_import_mutation_scopes_are_enforced(self):
        self.client.force_authenticate(self.user_a)
        self.assertEqual(self.client.post("/api/biomaterials/manual-import/", {}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/biomaterials/manual-import/", {}, format="json").status_code, 429)
        self.assertEqual(self.client.post("/api/proteins/import-fasta/", {}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/proteins/import-fasta/", {}, format="json").status_code, 429)

    def test_anonymous_requests_remain_denied_before_throttle(self):
        self.client.force_authenticate(None)
        self.assertIn(self.client.post("/api/interactions/docking-jobs/", {}, format="json").status_code, (401, 403))
        self.assertIn(self.client.get("/api/interactions/docking-worker/health/").status_code, (401, 403))
