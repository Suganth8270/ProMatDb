from rest_framework.response import Response
from rest_framework.decorators import api_view
import requests

from proteins.models import Protein
from .serializers import ProteinSerializer


@api_view(['GET'])
def protein_list(request):
    proteins = Protein.objects.all()
    serializer = ProteinSerializer(proteins, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def fetch_uniprot(request, uniprot_id):
    url = f"https://rest.uniprot.org/uniprotkb/{uniprot_id}.json"

    response = requests.get(url)

    if response.status_code != 200:
        return Response({"error": "Protein not found"}, status=404)

    data = response.json()

    return Response({
        "uniprot_id": uniprot_id,
        "protein_name": data["proteinDescription"]["recommendedName"]["fullName"]["value"],
        "organism": data["organism"]["scientificName"],
        "sequence": data["sequence"]["value"],
        "length": data["sequence"]["length"]
    })