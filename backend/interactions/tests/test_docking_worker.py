from datetime import timedelta
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from biomaterials.models import Biomaterial
from interactions.models import DockingJob, Interaction
from interactions.services.docking_worker import claim_next_job, recover_stale_jobs
from interactions.services.docking_workflow import create_docking_job
from proteins.models import Protein


class DockingWorkerReliabilityTests(TestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(username="docking-worker-owner", password="safe-test-password")
        self.protein = Protein.objects.create(protein_name="Worker protein", pdb_id="1A4V", uniprot_id="P00003")
        self.biomaterial = Biomaterial.objects.create(name="Worker ligand", pubchem_cid="2244", entity_type="biomaterial")
        self.payload = {"protein_id": self.protein.id, "biomaterial_id": self.biomaterial.id, "ligand_type": "biomaterial", "center_x": 1, "center_y": 2, "center_z": 3, "size_x": 20, "size_y": 20, "size_z": 20}

    def test_claim_sets_ownership_attempt_and_lease(self):
        job = create_docking_job(self.payload, owner=self.owner)
        claimed = claim_next_job()
        self.assertIsNotNone(claimed)
        claimed_job, token = claimed
        claimed_job.refresh_from_db()
        self.assertEqual(claimed_job.pk, job.pk)
        self.assertEqual(claimed_job.attempt_count, 1)
        self.assertEqual(claimed_job.worker_token, token)
        self.assertIsNotNone(claimed_job.lease_expires_at)
        self.assertIsNotNone(claimed_job.last_heartbeat_at)

    def test_stale_job_is_failed_without_interaction(self):
        job = create_docking_job(self.payload, owner=self.owner)
        job.status = DockingJob.STATUS_DOCKING
        job.attempt_count = 1
        job.worker_token = __import__("uuid").uuid4()
        job.lease_expires_at = timezone.now() - timedelta(seconds=1)
        job.last_heartbeat_at = timezone.now() - timedelta(seconds=2)
        job.save()
        self.assertEqual(recover_stale_jobs(), 1)
        job.refresh_from_db()
        self.assertEqual(job.status, DockingJob.STATUS_FAILED)
        self.assertEqual(job.failure_stage, "worker")
        self.assertIsNone(job.interaction_id)
        self.assertEqual(Interaction.objects.count(), 0)

    @patch("interactions.services.docking_worker.prepare_receptor")
    @patch("interactions.services.docking_worker.prepare_ligand")
    @patch("interactions.services.docking_worker.run_docking")
    @patch("interactions.services.docking_worker.import_docking_result")
    def test_full_lifecycle_reaches_completed(self, importer, run_docking, prepare_ligand, prepare_receptor):
        job = create_docking_job(self.payload, owner=self.owner)
        claimed = claim_next_job()
        self.assertIsNotNone(claimed)
        claimed_job, token = claimed
        prepare_receptor.return_value = SimpleNamespace(pdbqt_path=Path("receptor.pdbqt"))
        prepare_ligand.return_value = SimpleNamespace(pdbqt_path=Path("ligand.pdbqt"))
        run_docking.return_value = SimpleNamespace(
            output_pdbqt_path=Path("out.pdbqt"), log_path=Path("out.log"), vina_version="v1.2.7",
            seed=62024, exhaustiveness=8, cpu=1, box=SimpleNamespace(),
        )
        interaction = Interaction.objects.create(protein=self.protein, biomaterial=self.biomaterial, binding_energy=None, docking_score=-3.2, interaction_type="AutoDock Vina", reference="test")
        importer.return_value = SimpleNamespace(interaction=interaction)
        result = __import__("interactions.services.docking_worker", fromlist=["process_one_job"]).process_one_job(claimed_job, token)
        result.refresh_from_db()
        self.assertEqual(result.status, DockingJob.STATUS_COMPLETED)
        self.assertEqual(result.interaction_id, interaction.id)
        self.assertEqual(result.attempt_count, 1)
        self.assertEqual(prepare_receptor.call_count, 1)
        self.assertEqual(prepare_ligand.call_count, 1)
        self.assertEqual(run_docking.call_count, 1)
        self.assertEqual(importer.call_count, 1)

    def test_failed_jobs_do_not_change_existing_interactions(self):
        existing_2 = Interaction.objects.create(id=2, protein=self.protein, biomaterial=self.biomaterial, binding_energy=-8.5, docking_score=92.4, interaction_type="Adsorption", reference="Interaction 2")
        existing_3 = Interaction.objects.create(id=3, protein=self.protein, biomaterial=self.biomaterial, binding_energy=None, docking_score=-3.759, interaction_type="AutoDock Vina", reference="Interaction 3")
        job = create_docking_job({**self.payload, "center_x": 9}, owner=self.owner)
        job.status = DockingJob.STATUS_FAILED
        job.failure_stage = "docking"
        job.error_message = "validation failed"
        job.save()
        existing_2.refresh_from_db()
        existing_3.refresh_from_db()
        self.assertEqual(existing_2.docking_score, 92.4)
        self.assertEqual(existing_2.binding_energy, -8.5)
        self.assertEqual(existing_3.docking_score, -3.759)
        self.assertIsNone(existing_3.binding_energy)
        self.assertEqual(Interaction.objects.count(), 2)