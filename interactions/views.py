from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Interaction
from .serializers import InteractionSerializer


@api_view(["GET"])
def interaction_list(request):
    protein = request.GET.get("protein")
    biomaterial = request.GET.get("biomaterial")
    interaction = request.GET.get("interaction")

    interactions = Interaction.objects.all()

    if protein:
        interactions = interactions.filter(
            protein__protein_name__icontains=protein
        )

    if biomaterial:
        interactions = interactions.filter(
            biomaterial__name__icontains=biomaterial
        )

    if interaction:
        interactions = interactions.filter(
            interaction_type__icontains=interaction
        )

    serializer = InteractionSerializer(interactions, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def interaction_detail(request, pk):
    try:
        interaction = Interaction.objects.get(pk=pk)
    except Interaction.DoesNotExist:
          
        return Response({"error": "Interaction not found"}, status=404)
    serializer = InteractionSerializer(interaction)
    return Response(serializer.data)