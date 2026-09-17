from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from biomaterials.models import Biomaterial
from interactions.models import DockingJob, Interaction
from interactions.services import docking_artifacts as artifacts
from proteins.models import Protein


class Stage15EArtifactResolverTests(TestCase):
    def make_interaction(self, pdb_id="1A4V", cid="999001"):
        protein = Protein.objects.create(
            protein_name="Stage 15E protein",
            pdb_id=pdb_id,
            uniprot_id=f"STAGE15E-{pdb_id}-{cid}",
            sequence="ACD",
        )
        biomaterial = Biomaterial.objects.create(
            name="Stage 15E ligand",
            pubchem_cid=cid,
            entity_type="biomaterial",
        )
        return SimpleNamespace(
            id=1,
            protein=protein,
            biomaterial=biomaterial,
            docking_jobs=None,
        )

    def test_complete_allowlist_and_unknown_types(self):
        interaction = self.make_interaction()
        with TemporaryDirectory() as root:
            with patch.object(artifacts, "ARTIFACT_ROOT", Path(root)):
                for artifact_type, suffix in {
                    "pdbqt": "_vina_out.pdbqt",
                    "log": "_vina.log",
                    "sdf": "_vina_out.sdf",
                }.items():
                    path = artifacts._expected_path(interaction, artifact_type)
                    self.assertTrue(path.name.endswith(suffix))
                for value in ("unknown", "not-allowlisted", "../settings.py", r"..\settings.py", "%2e%2e%2fsettings.py", r"C:\\Windows\\win.ini", "/etc/passwd"):
                    with self.assertRaises(artifacts.DockingArtifactUnavailable):
                        artifacts._expected_path(interaction, value)

    def test_identity_validation_rejects_traversal_like_values(self):
        with TemporaryDirectory() as root:
            with patch.object(artifacts, "ARTIFACT_ROOT", Path(root)):
                for pdb_id, cid in (("../x", "1"), (r"..\x", "1"), ("1A4V", "../x"), ("1A4V", r"..\x"), ("/etc/passwd", "1")):
                    interaction = self.make_interaction(pdb_id=pdb_id, cid=cid)
                    with self.assertRaises(artifacts.DockingArtifactUnavailable):
                        artifacts._expected_path(interaction, "pdbqt")

    def test_expected_path_is_contained_and_outside_root_candidate_is_rejected(self):
        interaction = self.make_interaction()
        with TemporaryDirectory() as root, TemporaryDirectory() as outside:
            root_path = Path(root)
            with patch.object(artifacts, "ARTIFACT_ROOT", root_path):
                path = artifacts._expected_path(interaction, "pdbqt")
                self.assertTrue(root_path.resolve() in path.parents)
                with self.assertRaises(artifacts.DockingArtifactUnavailable):
                    artifacts._require_regular_file(Path(outside) / "outside.pdbqt")

    def test_symlink_outside_root_is_rejected_by_expected_path(self):
        interaction = self.make_interaction()
        with TemporaryDirectory() as root, TemporaryDirectory() as outside:
            root_path = Path(root)
            pair = "1A4V_receptor__999001_ligand"
            pair_dir = root_path / pair
            pair_dir.mkdir()
            outside_file = Path(outside) / "outside.pdbqt"
            outside_file.write_text("outside", encoding="utf-8")
            link = pair_dir / f"{pair}_vina_out.pdbqt"
            try:
                link.symlink_to(outside_file)
            except (OSError, NotImplementedError) as exc:
                self.skipTest(f"symlink creation unavailable: {exc}")
            with patch.object(artifacts, "ARTIFACT_ROOT", root_path):
                with self.assertRaises(artifacts.DockingArtifactUnavailable):
                    artifacts.get_artifact_path(interaction, "pdbqt")

    def test_directory_and_missing_artifact_are_rejected(self):
        interaction = self.make_interaction()
        with TemporaryDirectory() as root:
            with patch.object(artifacts, "ARTIFACT_ROOT", Path(root)):
                missing = artifacts._expected_path(interaction, "pdbqt")
                with self.assertRaises(artifacts.DockingArtifactUnavailable):
                    artifacts.get_artifact_path(interaction, "pdbqt")
                missing.parent.mkdir(parents=True)
                missing.mkdir()
                with self.assertRaises(artifacts.DockingArtifactUnavailable):
                    artifacts.get_artifact_path(interaction, "pdbqt")

    def test_existing_sdf_is_returned_without_regeneration(self):
        interaction = self.make_interaction()
        with TemporaryDirectory() as root:
            sdf = Path(root) / "existing.sdf"
            sdf.write_text("existing sdf", encoding="utf-8")
            with patch.object(artifacts, "_expected_path", return_value=sdf), patch.object(artifacts, "_resolve_meeko_export") as export:
                self.assertEqual(artifacts.ensure_sdf_artifact(interaction), sdf.resolve())
                export.assert_not_called()

    def test_missing_sdf_successful_conversion_is_validated(self):
        interaction = self.make_interaction()
        with TemporaryDirectory() as root:
            root_path = Path(root)
            pdbqt = root_path / "input.pdbqt"
            sdf = root_path / "output.sdf"
            pdbqt.write_text("MODEL        1\nREMARK VINA RESULT: -1.000 0.000 0.000\nATOM      1  C   LIG A   1       1.000   2.000   3.000  1.00  0.00           C\nENDMDL\n", encoding="utf-8")
            def expected(_interaction, kind):
                return {"pdbqt": pdbqt, "sdf": sdf}[kind]
            def fake_run(*args, **kwargs):
                sdf.write_text("converted", encoding="utf-8")
                return SimpleNamespace(returncode=0, stdout="", stderr="")
            with patch.object(artifacts, "_expected_path", side_effect=expected), patch.object(artifacts, "_resolve_meeko_export", return_value="fake-export"), patch.object(artifacts.subprocess, "run", side_effect=fake_run):
                self.assertEqual(artifacts.ensure_sdf_artifact(interaction), sdf.resolve())

    def test_sdf_timeout_is_controlled(self):
        interaction = self.make_interaction()
        with TemporaryDirectory() as root:
            sdf = Path(root) / "output.sdf"
            pdbqt = Path(root) / "input.pdbqt"
            pdbqt.write_text("ATOM      1  C   LIG A   1       1.000   2.000   3.000  1.00  0.00           C\n", encoding="utf-8")
            def expected(_interaction, kind):
                return {"pdbqt": pdbqt, "sdf": sdf}[kind]
            with patch.object(artifacts, "_expected_path", side_effect=expected), patch.object(artifacts, "_resolve_meeko_export", return_value="fake-export"), patch.object(artifacts.subprocess, "run", side_effect=artifacts.subprocess.TimeoutExpired("fake-export", 120)):
                with self.assertRaises(artifacts.DockingArtifactUnavailable):
                    artifacts.ensure_sdf_artifact(interaction)
                self.assertFalse(sdf.exists())

    def test_sdf_nonzero_failure_cleans_invalid_output(self):
        interaction = self.make_interaction()
        with TemporaryDirectory() as root:
            sdf = Path(root) / "output.sdf"
            pdbqt = Path(root) / "input.pdbqt"
            pdbqt.write_text("ATOM      1  C   LIG A   1       1.000   2.000   3.000  1.00  0.00           C\n", encoding="utf-8")
            def expected(_interaction, kind):
                return {"pdbqt": pdbqt, "sdf": sdf}[kind]
            def fake_run(*args, **kwargs):
                sdf.write_text("invalid", encoding="utf-8")
                return SimpleNamespace(returncode=1, stdout="", stderr="failure")
            with patch.object(artifacts, "_expected_path", side_effect=expected), patch.object(artifacts, "_resolve_meeko_export", return_value="fake-export"), patch.object(artifacts.subprocess, "run", side_effect=fake_run):
                with self.assertRaises(artifacts.DockingArtifactUnavailable):
                    artifacts.ensure_sdf_artifact(interaction)
                self.assertFalse(sdf.exists())


class Stage15EArtifactMethodTests(TestCase):
    def setUp(self):
        self.user = self.client_user()
        protein = Protein.objects.create(protein_name="Method protein", pdb_id="1A4V", uniprot_id="METHOD", sequence="ACD")
        biomaterial = Biomaterial.objects.create(name="Method ligand", pubchem_cid="999002", entity_type="biomaterial")
        interaction = Interaction.objects.create(protein=protein, biomaterial=biomaterial, binding_energy=None, docking_score=-1.0, interaction_type="AutoDock Vina", reference="method test")
        DockingJob.objects.create(owner=self.user, interaction=interaction, protein=protein, biomaterial=biomaterial, status=DockingJob.STATUS_QUEUED, center_x=1, center_y=2, center_z=3, size_x=20, size_y=20, size_z=20)
        self.interaction = interaction
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def client_user(self):
        from django.contrib.auth import get_user_model
        return get_user_model().objects.create_user(username="stage15e-method", password="test-password")

    def test_artifact_metadata_unsupported_methods_return_405(self):
        url = f"/api/interactions/{self.interaction.id}/artifacts/metadata/"
        for method in ("post", "put", "patch", "delete"):
            response = getattr(self.client, method)(url, {}, format="json")
            self.assertEqual(response.status_code, 405, method)

    def test_artifact_file_unsupported_methods_return_405(self):
        url = f"/api/interactions/{self.interaction.id}/artifacts/pdbqt/"
        for method in ("post", "put", "patch", "delete"):
            response = getattr(self.client, method)(url, {}, format="json")
            self.assertEqual(response.status_code, 405, method)
