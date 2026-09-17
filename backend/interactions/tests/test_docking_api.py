from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from biomaterials.models import Biomaterial
from interactions.models import DockingJob, Interaction
from proteins.models import Protein


class DockingApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="docking-api-user", password="safe-test-password")
        self.client.force_authenticate(self.user)
        self.protein = Protein.objects.create(protein_name="API protein", pdb_id="1A4V", uniprot_id="P00002")
        self.biomaterial = Biomaterial.objects.create(name="API ligand", pubchem_cid="2244", entity_type="biomaterial")
        self.payload = {"protein_id": self.protein.id, "biomaterial_id": self.biomaterial.id, "ligand_type": "biomaterial", "center_x": 1, "center_y": 2, "center_z": 3, "size_x": 20, "size_y": 20, "size_z": 20}

    def test_submit_status_and_health_are_safe(self):
        response = self.client.post("/api/interactions/docking-jobs/", self.payload, format="json")
        self.assertEqual(response.status_code, 202)
        data = response.json()
        self.assertNotIn("worker_token", data)
        self.assertNotIn("path", str(data).lower())
        status = self.client.get(f"/api/interactions/docking-jobs/{data['id']}/")
        self.assertEqual(status.status_code, 200)
        self.assertIn("attempt_count", status.json())
        health = self.client.get("/api/interactions/docking-worker/health/")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(set(health.json()), {"status", "queued_count", "active_count"})

    def test_invalid_error_is_serialized_without_sensitive_details(self):
        response = self.client.post("/api/interactions/docking-jobs/", {**self.payload, "extra": "x"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(set(response.json()), {"error"})
