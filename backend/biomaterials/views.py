from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import Biomaterial
from .serializers import BiomaterialSerializer


@api_view(["GET"])
def biomaterial_list(request):
    biomaterials = Biomaterial.objects.all()
    serializer = BiomaterialSerializer(biomaterials, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def biomaterial_detail(request, pk):
    try:
        biomaterial = Biomaterial.objects.get(pk=pk)
    except Biomaterial.DoesNotExist:
        return Response({"error": "Biomaterial not found"}, status=404)

    serializer = BiomaterialSerializer(biomaterial)
    return Response(serializer.data)