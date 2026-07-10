from rest_framework import serializers

from .models import Interaction
from proteins.models import Protein
from biomaterials.models import Biomaterial


class ProteinMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Protein
        fields = ["id", "protein_name", "uniprot_id"]


class BiomaterialMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Biomaterial
        fields = ["id", "name", "category"]


class InteractionSerializer(serializers.ModelSerializer):
    protein = ProteinMiniSerializer(read_only=True)
    biomaterial = BiomaterialMiniSerializer(read_only=True)

    class Meta:
        model = Interaction
        fields = "__all__"