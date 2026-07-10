from rest_framework import serializers
from proteins.models import Protein


class ProteinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Protein
        fields = '__all__'