from rest_framework import serializers
from .models import Biomaterial


class BiomaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Biomaterial
        fields = "__all__"