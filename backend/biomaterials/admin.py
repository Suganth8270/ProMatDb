from django.contrib import admin
from .models import Biomaterial


@admin.register(Biomaterial)
class BiomaterialAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "source",
        "chemical_type",
        "pubchem_cid",
        "chebi_id",
    )

    search_fields = (
        "name",
        "category",
        "source",
        "pubchem_cid",
        "chebi_id",
    )

    list_filter = (
        "category",
        "chemical_type",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        ("Basic Information", {
            "fields": (
                "name",
                "category",
                "source",
                "description",
                "applications",
            )
        }),

        ("Scientific Information", {
            "fields": (
                "molecular_formula",
                "molecular_weight",
                "chemical_type",
            )
        }),

        ("Material Properties", {
            "fields": (
                "biocompatibility",
                "biodegradability",
                "mechanical_strength",
                "thermal_stability",
            )
        }),

        ("External IDs", {
            "fields": (
                "pubchem_cid",
                "chebi_id",
            )
        }),

        ("Images", {
            "fields": (
                "image_url",
                "structure_image",
                "sem_image",
            )
        }),

        ("References", {
            "fields": (
                "doi",
                "pubmed_url",
            )
        }),

        ("Audit", {
            "fields": (
                "created_at",
                "updated_at",
            )
        }),
    )