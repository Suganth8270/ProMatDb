from django.test import TestCase
from rest_framework.test import APIClient

from biomaterials.models import Biomaterial


class BiomaterialClassificationTests(TestCase):
    def setUp(self):
        self.cellulose = Biomaterial.objects.create(name="Cellulose", category="Natural Polymer", pubchem_cid="107735", entity_type=Biomaterial.ENTITY_TYPE_BIOMATERIAL)
        self.aspirin = Biomaterial.objects.create(name="Aspirin", pubchem_cid="2244", entity_type=Biomaterial.ENTITY_TYPE_DRUG)
        self.calcium = Biomaterial.objects.create(name="Calcium", pubchem_cid="5460341", entity_type=None)

    def test_supported_classifications(self):
        self.assertEqual(self.cellulose.entity_type, Biomaterial.ENTITY_TYPE_BIOMATERIAL)
        self.assertEqual(self.aspirin.entity_type, Biomaterial.ENTITY_TYPE_DRUG)
        self.assertIsNone(self.calcium.entity_type)
        self.assertEqual({value for value, _label in Biomaterial.ENTITY_TYPE_CHOICES}, {"biomaterial", "drug", "small_molecule"})

    def test_filtered_api(self):
        client = APIClient()
        biomaterials = client.get("/api/biomaterials/", {"entity_type": "biomaterial"})
        self.assertEqual(biomaterials.status_code, 200)
        names = {row["name"] for row in biomaterials.data}
        self.assertIn("Cellulose", names)
        self.assertNotIn("Aspirin", names)
        drugs = client.get("/api/biomaterials/", {"entity_type": "drug"})
        self.assertEqual(drugs.status_code, 200)
        self.assertIn("Aspirin", {row["name"] for row in drugs.data})
