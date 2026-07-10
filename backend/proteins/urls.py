from django.urls import path
from .views import (
    protein_list,
    protein_detail,
    fetch_uniprot,
    import_uniprot,
)

urlpatterns = [
    path("proteins/", protein_list, name="protein-list"),
    path("proteins/<int:pk>/", protein_detail, name="protein-detail"),
    path("uniprot/<str:uniprot_id>/", fetch_uniprot, name="fetch-uniprot"),
    path("import/<str:uniprot_id>/", import_uniprot, name="import-uniprot"),
]