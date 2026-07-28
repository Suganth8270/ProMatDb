from django.urls import path
from .views import (
    interaction_list,
    interaction_detail,
    protein_interactions,
    biomaterial_interactions,
)
urlpatterns = [
   path("", interaction_list, name="interaction-list"),
path("<int:pk>/", interaction_detail, name="interaction-detail"),

    path(
        "proteins/<int:protein_id>/interactions/",
        protein_interactions,
        name="protein-interactions",
    ),

    path(
        "biomaterials/<int:biomaterial_id>/interactions/",
        biomaterial_interactions,
        name="biomaterial-interactions",
    ),
]