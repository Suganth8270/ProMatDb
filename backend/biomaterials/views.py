from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Biomaterial
from .serializers import BiomaterialSerializer
from .services import BiomaterialSearchService

# 👇 Rename the imported service
from .services.pubchem import search_pubchem as search_pubchem_service

import requests

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

@api_view(["GET"])
def search_biomaterial(request):
    name = request.GET.get("name")

    if not name:
        return Response({"error": "Missing biomaterial name"}, status=400)

    result = BiomaterialSearchService.search(name)

    if not result:
        return Response({"error": "No biomaterial found"}, status=404)

    return Response(result)


@api_view(["GET"])
def search_pubchem(request):
    name = request.GET.get("name")

    if not name:
        return Response({"error": "Name is required"}, status=400)

    try:
        # Search PubChem CID
        cid_url = (
            f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/"
            f"{name}/cids/JSON"
        )

        cid_response = requests.get(cid_url)
        cid_response.raise_for_status()

        cid = cid_response.json()["IdentifierList"]["CID"][0]

        # Fetch compound properties
        property_url = (
            "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/"
            f"{cid}/property/"
            "MolecularFormula,MolecularWeight,IUPACName/JSON"
        )

        property_response = requests.get(property_url)
        property_response.raise_for_status()

        props = property_response.json()["PropertyTable"]["Properties"][0]

        return Response({
            "cid": cid,
            "name": name.title(),
            "formula": props.get("MolecularFormula", ""),
            "molecular_weight": props.get("MolecularWeight", ""),
            "iupac_name": props.get("IUPACName", ""),
        })

    except Exception as e:
        return Response({"error": str(e)}, status=404)
    
@api_view(["GET"])
def import_pubchem(request, cid):
    data = search_pubchem_service(cid)

    if not data:
        return Response(
            {"error": "Biomaterial not found in PubChem"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(data)
@api_view(["POST"])
def save_imported_pubchem(request, cid):
    """
    Fetch a biomaterial from PubChem and save it to the database.
    Prevents duplicate imports using the PubChem CID.
    """

    data = search_pubchem_service(cid)

    if not data:
        return Response(
            {"error": "Biomaterial not found in PubChem"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check if already imported
    biomaterial = Biomaterial.objects.filter(
        pubchem_cid=data["pubchem_cid"]
    ).first()

    if biomaterial:
        serializer = BiomaterialSerializer(biomaterial)
        return Response(
            {
                "message": "Biomaterial already exists.",
                "created": False,
                "biomaterial": serializer.data,
            }
        )

    # Create new biomaterial
    biomaterial = Biomaterial.objects.create(
        name=data["name"],
        pubchem_cid=data["pubchem_cid"],
        molecular_formula=data["molecular_formula"],
        molecular_weight=data["molecular_weight"],
    )

    serializer = BiomaterialSerializer(biomaterial)

    return Response(
        {
            "message": "Biomaterial imported successfully.",
            "created": True,
            "biomaterial": serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )