from django.http import JsonResponse
from django.db.models import Q

from proteins.models import Protein
from biomaterials.models import Biomaterial
from interactions.models import Interaction


def api_home(request):
    return JsonResponse({
        "message": "Welcome to ProMatDB API",
        "version": "1.0"
    })

from django.utils import timezone


def dashboard_stats(request):
    today = timezone.localdate()

    imported_today = Protein.objects.filter(
        created_at__date=today
    ).count()

    latest_proteins = Protein.objects.order_by("-created_at")[:5]

    recent_activity = [
        {
            "title": "Protein Imported",
            "detail": protein.protein_name,
            "time": protein.created_at.strftime("%d %b %Y %H:%M"),
        }
        for protein in latest_proteins
    ]

    return JsonResponse({
        "total_proteins": Protein.objects.count(),
        "total_biomaterials": Biomaterial.objects.count(),
        "total_interactions": Interaction.objects.count(),
        "imported_today": imported_today,
        "recent_activity": recent_activity,
    })


def global_search(request):
    query = request.GET.get("q", "").strip()

    proteins = []
    biomaterials = []
    interactions = []

    if query:

        # Protein Search
        protein_results = Protein.objects.filter(
            Q(protein_name__icontains=query) |
            Q(uniprot_id__icontains=query) |
            Q(pdb_id__icontains=query) |
            Q(organism__icontains=query)
        )

        proteins = [
            {
                "id": protein.id,
                "protein_name": protein.protein_name,
                "uniprot_id": protein.uniprot_id,
                "pdb_id": protein.pdb_id,
                "organism": protein.organism,
            }
            for protein in protein_results
        ]

        # Biomaterial Search
        biomaterial_results = Biomaterial.objects.filter(
            Q(name__icontains=query) |
            Q(category__icontains=query) |
            Q(source__icontains=query)
        )

        biomaterials = [
            {
                "id": biomaterial.id,
                "name": biomaterial.name,
                "category": biomaterial.category,
                "source": biomaterial.source,
            }
            for biomaterial in biomaterial_results
        ]

        # Interaction Search
        interaction_results = Interaction.objects.filter(
            Q(interaction_type__icontains=query) |
            Q(protein__protein_name__icontains=query) |
            Q(biomaterial__name__icontains=query)
        )

        interactions = [
            {
                "id": interaction.id,
                "protein": interaction.protein.protein_name,
                "biomaterial": interaction.biomaterial.name,
                "interaction_type": interaction.interaction_type,
                "binding_energy": interaction.binding_energy,
                "docking_score": interaction.docking_score,
                "reference": interaction.reference,
            }
            for interaction in interaction_results
        ]

    return JsonResponse({
        "query": query,
        "proteins": proteins,
        "biomaterials": biomaterials,
        "interactions": interactions,
    })