from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework.settings import api_settings
import requests

from .models import Protein
from api.serializers import ProteinSerializer


@api_view(['GET'])
def protein_list(request):
    search = request.GET.get("search")

    if search:
        proteins = Protein.objects.filter(
            protein_name__icontains=search
        ).order_by("protein_name")
    else:
        proteins = Protein.objects.order_by("protein_name")

    paginator = PageNumberPagination()
    paginator.page_size = api_settings.PAGE_SIZE

    result_page = paginator.paginate_queryset(proteins, request)
    serializer = ProteinSerializer(result_page, many=True)

    return paginator.get_paginated_response(serializer.data)

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


@api_view(['POST'])
def import_uniprot(request, uniprot_id):
    url = f"https://rest.uniprot.org/uniprotkb/{uniprot_id}.json"

    response = requests.get(url)

    if response.status_code != 200:
        return Response({"error": "Protein not found"}, status=404)

    data = response.json()

    protein_name = data["proteinDescription"]["recommendedName"]["fullName"]["value"]
    organism = data["organism"]["scientificName"]
    sequence = data["sequence"]["value"]

    protein, created = Protein.objects.get_or_create(
        uniprot_id=uniprot_id,
        defaults={
            "protein_name": protein_name,
            "organism": organism,
            "sequence": sequence,
            "pdb_id": "",
            "molecular_weight": 0.0,
            "function": ""
        }
    )

@api_view(['GET'])
def protein_detail(request, pk):
    try:
        protein = Protein.objects.get(pk=pk)
    except Protein.DoesNotExist:
        return Response(
            {"error": "Protein not found"},
            status=404
        )

    serializer = ProteinSerializer(protein)
    return Response(serializer.data)

    if created:
        return Response({
            "message": "Protein imported successfully",
            "protein_id": protein.id
        })

    return Response({
        "message": "Protein already exists",
        "protein_id": protein.id
    })