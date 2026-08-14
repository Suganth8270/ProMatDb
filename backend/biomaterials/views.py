from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd
from django.db import transaction

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

    results = BiomaterialSearchService.search(name)

    if not results:
        return Response({"error": "No biomaterial found"}, status=404)

    return Response(results)

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


@api_view(["POST"])
def manual_import_biomaterial(request):
    """
    Manually create a biomaterial from user-supplied JSON,
    without going through PubChem or ChEBI.
    Prevents duplicates by name (case-insensitive).
    """

    payload = request.data

    name = (payload.get("name") or "").strip()

    if not name:
        return Response(
            {"error": "Name is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Prevent duplicate biomaterials by name (case-insensitive)
    existing = Biomaterial.objects.filter(name__iexact=name).first()

    if existing:
        return Response(
            {
                "message": "Biomaterial already exists",
                "created": False,
            }
        )

    biomaterial = Biomaterial.objects.create(
        name=name,
        category=payload.get("category", ""),
        chemical_type=payload.get("chemical_type", ""),
        source=payload.get("source", ""),
        description=payload.get("description", ""),
        applications=payload.get("applications", ""),
        molecular_formula=payload.get("molecular_formula", ""),
        molecular_weight=payload.get("molecular_weight", ""),
        biocompatibility=payload.get("biocompatibility", ""),
        image_url=payload.get("image_url", ""),
        doi=payload.get("doi", ""),
        pubmed_url=payload.get("pubmed_url", ""),
    )

    serializer = BiomaterialSerializer(biomaterial)

    return Response(
        {
            "message": "Biomaterial imported successfully",
            "created": True,
            "biomaterial": serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def bulk_import_biomaterials(request):
    """
    Bulk import biomaterials from CSV or Excel.
    """

    if "file" not in request.FILES:
        return Response(
            {"error": "No file uploaded"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    file = request.FILES["file"]

    try:
        if file.name.endswith(".csv"):
            df = pd.read_csv(file)

        elif file.name.endswith(".xlsx"):
            df = pd.read_excel(file)

        else:
            return Response(
                {"error": "Only CSV and Excel files are supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    required_columns = [
        "name",
        "category",
        "chemical_type",
        "source",
        "description",
        "applications",
        "molecular_formula",
        "molecular_weight",
        "biocompatibility",
        "doi",
        "pubmed_url",
    ]

    missing = [c for c in required_columns if c not in df.columns]

    if missing:
        return Response(
            {
                "error": "Missing required columns",
                "missing": missing,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    imported = 0
    duplicates = 0
    failed = 0

    with transaction.atomic():

        for _, row in df.iterrows():

            try:

                name = str(row["name"]).strip()

                if Biomaterial.objects.filter(name__iexact=name).exists():
                    duplicates += 1
                    continue

                Biomaterial.objects.create(
                    name=name,
                    category=row.get("category", ""),
                    chemical_type=row.get("chemical_type", ""),
                    source=row.get("source", ""),
                    description=row.get("description", ""),
                    applications=row.get("applications", ""),
                    molecular_formula=row.get("molecular_formula", ""),
                    molecular_weight=row.get("molecular_weight", ""),
                    biocompatibility=row.get("biocompatibility", ""),
                    doi=row.get("doi", ""),
                    pubmed_url=row.get("pubmed_url", ""),
                )

                imported += 1

            except Exception:
                failed += 1

    return Response(
        {
            "imported": imported,
            "duplicates": duplicates,
            "failed": failed,
        },
        status=status.HTTP_201_CREATED,
    )