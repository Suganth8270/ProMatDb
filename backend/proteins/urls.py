from django.urls import path
from .views import (
    protein_list,
    protein_detail,
    fetch_uniprot,
    import_uniprot,
    fetch_pdb,
    link_pdb,
    import_fasta,
)

urlpatterns = [
    path("", protein_list, name="protein-list"),
    path("<int:pk>/", protein_detail, name="protein-detail"),

    # UniProt
    path("uniprot/<str:uniprot_id>/", fetch_uniprot, name="fetch-uniprot"),
    path("import/<str:uniprot_id>/", import_uniprot, name="import-uniprot"),

    # PDB
    path("pdb/<str:pdb_id>/", fetch_pdb, name="fetch-pdb"),
    path("link-pdb/", link_pdb, name="link-pdb"),

    # FASTA
    path("import-fasta/", import_fasta, name="import-fasta"),
]