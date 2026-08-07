from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework.settings import api_settings
import requests

from .models import Protein
from api.serializers import ProteinSerializer


@api_view(["GET"])
def protein_list(request):
    search = request.GET.get("search")

    if search:
        proteins = Protein.objects.filter(
            protein_name__icontains=search
        ).order_by("protein_name")
    else:
        proteins = Protein.objects.order_by("protein_name")

    serializer = ProteinSerializer(proteins, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def protein_detail(request, pk):
    try:
        protein = Protein.objects.get(pk=pk)
    except Protein.DoesNotExist:
        return Response(
            {"error": "Protein not found"},
            status=404,
        )

    serializer = ProteinSerializer(protein)
    return Response(serializer.data)


@api_view(["GET"])
def fetch_uniprot(request, uniprot_id):
    url = f"https://rest.uniprot.org/uniprotkb/{uniprot_id}.json"

    response = requests.get(url)

    if response.status_code != 200:
        return Response(
            {"error": "Protein not found"},
            status=404,
        )

    data = response.json()

    protein_name = (
        data.get("proteinDescription", {})
        .get("recommendedName", {})
        .get("fullName", {})
        .get("value", "")
    )

    organism = data.get("organism", {}).get("scientificName", "")

    sequence = data.get("sequence", {}).get("value", "")

    molecular_weight = (
        data.get("sequence", {}).get("molWeight", 0)
    )

    function = ""

    comments = data.get("comments", [])

    for comment in comments:
        if comment.get("commentType") == "FUNCTION":
            texts = comment.get("texts", [])
            if texts:
                function = texts[0].get("value", "")
                break

    return Response({
        "uniprot_id": uniprot_id,
        "protein_name": protein_name,
        "organism": organism,
        "sequence": sequence,
        "sequence_length": len(sequence),
        "molecular_weight": molecular_weight,
        "function": function,
    })


@api_view(["POST"])
def import_uniprot(request, uniprot_id):
    url = f"https://rest.uniprot.org/uniprotkb/{uniprot_id}.json"

    response = requests.get(url)

    if response.status_code != 200:
        return Response(
            {"error": "Protein not found"},
            status=404,
        )

    data = response.json()

    protein_name = (
        data.get("proteinDescription", {})
        .get("recommendedName", {})
        .get("fullName", {})
        .get("value", "")
    )

    organism = data.get("organism", {}).get("scientificName", "")

    sequence = data.get("sequence", {}).get("value", "")

    molecular_weight = data.get("sequence", {}).get("molWeight", 0)

    function = ""
    pdb_id = ""

    # Get first available PDB ID
    cross_refs = data.get("uniProtKBCrossReferences", [])

    for ref in cross_refs:
        if ref.get("database") == "PDB":
            pdb_id = ref.get("id", "")
            break

    # Get protein function
    comments = data.get("comments", [])

    for comment in comments:
        if comment.get("commentType") == "FUNCTION":
            texts = comment.get("texts", [])
            if texts:
                function = texts[0].get("value", "")
                break
    protein, created = Protein.objects.get_or_create(
        uniprot_id=uniprot_id,
        defaults={
            "protein_name": protein_name,
            "organism": organism,
            "sequence": sequence,
            "pdb_id": pdb_id,
            "molecular_weight": molecular_weight,
            "function": function,
        },
    )

    if not created:
        protein.protein_name = protein_name
        protein.organism = organism
        protein.sequence = sequence
        protein.pdb_id = pdb_id
        protein.molecular_weight = molecular_weight
        protein.function = function
        protein.save()

    serializer = ProteinSerializer(protein)


    

    return Response({
        "created": created,
        "message": (
            "Protein imported successfully."
            if created
            else "Protein already exists."
        ),
        "protein_id": protein.id,
        "protein": serializer.data,
    })

@api_view(["GET"])
def fetch_pdb(request, pdb_id):
    url = f"https://data.rcsb.org/rest/v1/core/entry/{pdb_id}"

    response = requests.get(url)

    if response.status_code != 200:
        return Response(
            {"error": "PDB entry not found"},
            status=404,
        )

    data = response.json()

    title = (
        data.get("struct", {})
        .get("title", "")
    )

    deposition_date = (
        data.get("rcsb_accession_info", {})
        .get("deposit_date", "")
    )

    experimental_method = ""

    methods = data.get("exptl", [])
    if methods:
        experimental_method = methods[0].get("method", "")

    resolution = None

    if "rcsb_entry_info" in data:
        resolution = data["rcsb_entry_info"].get(
            "resolution_combined",
            []
        )

    return Response({
        "pdb_id": pdb_id.upper(),
        "title": title,
        "experimental_method": experimental_method,
        "resolution": resolution,
        "deposition_date": deposition_date,
    })
@api_view(["POST"])
def link_pdb(request):
    uniprot_id = request.data.get("uniprot_id")
    pdb_id = request.data.get("pdb_id")

    if not uniprot_id or not pdb_id:
        return Response(
            {"error": "uniprot_id and pdb_id are required."},
            status=400,
        )

    try:
        protein = Protein.objects.get(uniprot_id=uniprot_id)
    except Protein.DoesNotExist:
        return Response(
            {"error": "Protein not found."},
            status=404,
        )

    protein.pdb_id = pdb_id.upper()
    protein.save()

    return Response({
        "message": "PDB linked successfully.",
        "protein": ProteinSerializer(protein).data,
    })

@api_view(["POST"])
def import_fasta(request):
    header = request.data.get("header", "").strip()
    sequence = request.data.get("sequence", "").strip()

    if not sequence:
        return Response(
            {"error": "Sequence is required."},
            status=400,
        )

    protein = Protein.objects.create(
        protein_name=header if header else "FASTA Protein",
        uniprot_id=f"FASTA_{Protein.objects.count() + 1}",
        pdb_id="",
        organism="Unknown",
        sequence=sequence,
        molecular_weight=0.0,
        function="Imported from FASTA",
    )

    serializer = ProteinSerializer(protein)

    return Response({
        "message": "FASTA imported successfully.",
        "protein": serializer.data,
    })