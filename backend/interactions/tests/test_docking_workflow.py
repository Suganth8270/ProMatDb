from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from biomaterials.models import Biomaterial
from interactions.models import DockingJob, Interaction
from interactions.services.docking_workflow import DockingRequestError, create_docking_job
from proteins.models import Protein


class DockingWorkflowTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(username="docking-workflow-owner", password="safe-test-password")
        self.protein = Protein.objects.create(protein_name="Test protein", pdb_id="1A4V", uniprot_id="P00001")
        self.biomaterial = Biomaterial.objects.create(name="Test ligand", pubchem_cid="2244", entity_type="biomaterial")
        self.payload = {"protein_id": self.protein.id, "biomaterial_id": self.biomaterial.id, "ligand_type": "biomaterial", "center_x": 1, "center_y": 2, "center_z": 3, "size_x": 20, "size_y": 20, "size_z": 20}

    def test_rejects_extra_field(self):
        with self.assertRaisesRegex(DockingRequestError, "Unsupported"):
            create_docking_job({**self.payload, "path": "db.sqlite3"}, owner=self.owner)

    def test_rejects_nonfinite_or_bad_box(self):
        with self.assertRaises(DockingRequestError): create_docking_job({**self.payload, "center_x": float("nan")}, owner=self.owner)
        with self.assertRaises(DockingRequestError): create_docking_job({**self.payload, "size_x": 0}, owner=self.owner)
        with self.assertRaises(DockingRequestError): create_docking_job({**self.payload, "size_x": 101}, owner=self.owner)

    def test_duplicate_active_pair_is_rejected(self):
        create_docking_job(self.payload, owner=self.owner)
        with self.assertRaisesRegex(DockingRequestError, "already exists"):
            create_docking_job(self.payload, owner=self.owner)

    def test_terminal_jobs_do_not_block_new_submission(self):
        first = create_docking_job(self.payload, owner=self.owner)
        first.status = DockingJob.STATUS_FAILED
        first.save(update_fields=["status"])
        second = create_docking_job(self.payload, owner=self.owner)
        self.assertNotEqual(first.pk, second.pk)