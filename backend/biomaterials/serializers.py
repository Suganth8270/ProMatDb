from rest_framework import serializers
from .models import Biomaterial


class BiomaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Biomaterial
        fields = [
            "id",
            "name",
            "category",
            "source",
            "description",
            "applications",

            "pubchem_cid",
            "chebi_id",

            "molecular_formula",
            "molecular_weight",
            "chemical_type",

            "biocompatibility",
            "biodegradability",
            "mechanical_strength",
            "thermal_stability",

            "image_url",
            "structure_image",
            "sem_image",

            "doi",
            "pubmed_url",

            "created_at",
            "updated_at",
        ]