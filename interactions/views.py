from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Interaction
from .serializers import InteractionSerializer


@api_view(["GET"])
def interaction_list(request):
    """
    Return all protein–biomaterial interactions.
    """
    interactions = Interaction.objects.all()
    serializer = InteractionSerializer(interactions, many=True)
    return Response(serializer.data)