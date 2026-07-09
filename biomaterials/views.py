from rest_framework import generics
from .models import Biomaterial
from .serializers import BiomaterialSerializer


class BiomaterialListAPIView(generics.ListAPIView):
    queryset = Biomaterial.objects.all()
    serializer_class = BiomaterialSerializer