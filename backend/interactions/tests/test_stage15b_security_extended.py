from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient

from biomaterials.models import Biomaterial
from interactions.models import DockingJob, Interaction
from proteins.models import Protein


class Stage15BSecurityExtendedTests(TestCase):
    def setUp(self):
        cache.clear()
        User = get_user_model()
        self.a = User.objects.create_user(username="stage15-ext-a", password="safe-password-a")
        self.b = User.objects.create_user(username="stage15-ext-b", password="safe-password-b")
        self.p = Protein.objects.create(protein_name="Security protein", pdb_id="1A4V", uniprot_id="SEC15", sequence="ACD")
        self.m = Biomaterial.objects.create(name="Security ligand", pubchem_cid="999002", entity_type="biomaterial")
        self.payload = {"protein_id": self.p.id, "biomaterial_id": self.m.id, "ligand_type": "biomaterial", "center_x": 1, "center_y": 2, "center_z": 3, "size_x": 20, "size_y": 20, "size_z": 20}
        self.client = APIClient()

    def make_job(self, owner=None, interaction=None):
        return DockingJob.objects.create(owner=owner, interaction=interaction, protein=self.p, biomaterial=self.m, status=DockingJob.STATUS_QUEUED, **{k: self.payload[k] for k in ("center_x", "center_y", "center_z", "size_x", "size_y", "size_z")})

    def test_anonymous_status_health_and_artifacts_denied(self):
        self.client.force_authenticate(self.a)
        job = self.client.post("/api/interactions/docking-jobs/", self.payload, format="json").json()
        self.client.force_authenticate(None)
        self.assertIn(self.client.get(f"/api/interactions/docking-jobs/{job['id']}/").status_code, (401, 403))
        self.assertIn(self.client.get("/api/interactions/docking-worker/health/").status_code, (401, 403))
        self.assertIn(self.client.get("/api/interactions/999999/artifacts/metadata/").status_code, (401, 403))
        self.assertIn(self.client.get("/api/interactions/999999/artifacts/pdbqt/").status_code, (401, 403))

    def test_authenticated_creator_owns_new_job_and_cross_user_is_denied(self):
        self.client.force_authenticate(self.a)
        response = self.client.post("/api/interactions/docking-jobs/", self.payload, format="json")
        self.assertEqual(response.status_code, 202)
        job = DockingJob.objects.get(pk=response.json()["id"])
        self.assertEqual(job.owner_id, self.a.id)
        self.client.force_authenticate(self.b)
        self.assertEqual(self.client.get(f"/api/interactions/docking-jobs/{job.id}/").status_code, 404)

    def test_client_owner_fields_are_rejected_without_creating_job(self):
        self.client.force_authenticate(self.a)
        before = DockingJob.objects.count()
        response = self.client.post(
            "/api/interactions/docking-jobs/",
            {**self.payload, "owner": self.b.id, "owner_id": self.b.id},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(DockingJob.objects.count(), before)

    def test_owner_and_cross_user_artifact_authorization(self):
        interaction = Interaction.objects.create(protein=self.p, biomaterial=self.m, binding_energy=None, docking_score=-2.1, interaction_type="AutoDock Vina", reference="isolated security test")
        job = self.make_job(owner=self.a, interaction=interaction)
        with patch("interactions.artifact_views.get_docking_artifacts", return_value={"pose_count": 0}), patch("interactions.artifact_views.get_artifact_path") as get_path:
            self.client.force_authenticate(self.a)
            self.assertEqual(self.client.get(f"/api/interactions/{interaction.id}/artifacts/metadata/").status_code, 200)
            self.client.force_authenticate(self.b)
            self.assertEqual(self.client.get(f"/api/interactions/{interaction.id}/artifacts/metadata/").status_code, 404)
            self.assertEqual(self.client.get(f"/api/interactions/{interaction.id}/artifacts/pdbqt/").status_code, 404)
            get_path.assert_not_called()
        self.assertEqual(job.owner_id, self.a.id)

    def test_invalid_artifact_type_and_path_are_not_authorized_or_exposed(self):
        interaction = Interaction.objects.create(protein=self.p, biomaterial=self.m, binding_energy=None, docking_score=-2.2, interaction_type="AutoDock Vina", reference="artifact safety test")
        self.make_job(owner=self.a, interaction=interaction)
        self.client.force_authenticate(self.a)
        response = self.client.get(f"/api/interactions/{interaction.id}/artifacts/not-allowlisted/")
        self.assertEqual(response.status_code, 404)
        self.assertNotIn("/", response.json().get("error", ""))

    def test_public_reference_gets_and_protected_interaction_get(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/biomaterials/").status_code, 200)
        self.assertEqual(self.client.get("/api/proteins/").status_code, 200)
        self.assertIn(self.client.get("/api/interactions/").status_code, (401, 403))

    def test_anonymous_mutations_denied(self):
        self.client.force_authenticate(None)
        for path in ("/api/biomaterials/manual-import/", "/api/biomaterials/bulk-import/", "/api/biomaterials/import/2244/save/", "/api/proteins/import/TEST/", "/api/proteins/link-pdb/", "/api/proteins/import-fasta/"):
            self.assertIn(self.client.post(path, {}, format="json").status_code, (401, 403), path)

    def test_session_post_requires_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        self.assertTrue(client.login(username="stage15-ext-a", password="safe-password-a"))
        response = client.post("/api/interactions/docking-jobs/", self.payload, format="json")
        self.assertEqual(response.status_code, 403)

    def tearDown(self):
        cache.clear()
        super().tearDown()
