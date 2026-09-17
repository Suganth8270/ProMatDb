from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from biomaterials.models import Biomaterial
from proteins.models import Protein
from interactions.models import DockingJob
class Stage15BSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client=APIClient(); self.a=get_user_model().objects.create_user(username="stage15a",password="safe-password-1"); self.b=get_user_model().objects.create_user(username="stage15b",password="safe-password-2"); self.p=Protein.objects.create(protein_name="Auth protein",uniprot_id="AUTH15",pdb_id="1A4V",organism="test",sequence="ACD",molecular_weight=1,function="test"); self.m=Biomaterial.objects.create(name="Auth biomaterial",pubchem_cid="999001",entity_type="biomaterial")
    def payload(self): return {"protein_id":self.p.id,"biomaterial_id":self.m.id,"ligand_type":"biomaterial","center_x":1,"center_y":2,"center_z":3,"size_x":20,"size_y":20,"size_z":20}
    def test_anonymous_submission_denied(self):
        before=DockingJob.objects.count(); r=self.client.post("/api/interactions/docking-jobs/",self.payload(),format="json"); self.assertIn(r.status_code,(401,403)); self.assertEqual(DockingJob.objects.count(),before)
    def test_owner_and_cross_user_status(self):
        self.client.force_authenticate(self.a); r=self.client.post("/api/interactions/docking-jobs/",self.payload(),format="json"); self.assertEqual(r.status_code,202); j=DockingJob.objects.get(pk=r.json()["id"]); self.assertEqual(j.owner_id,self.a.id); self.client.force_authenticate(self.b); self.assertEqual(self.client.get(f"/api/interactions/docking-jobs/{j.id}/").status_code,404)
    def test_historical_owner_null_denied(self):
        j=DockingJob.objects.create(protein=self.p,biomaterial=self.m,status=DockingJob.STATUS_COMPLETED,center_x=1,center_y=2,center_z=3,size_x=20,size_y=20,size_z=20); self.client.force_authenticate(self.a); self.assertEqual(self.client.get(f"/api/interactions/docking-jobs/{j.id}/").status_code,404); self.assertIsNone(DockingJob.objects.get(pk=j.id).owner_id)

    def tearDown(self):
        cache.clear()
        super().tearDown()
