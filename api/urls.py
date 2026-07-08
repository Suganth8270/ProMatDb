from django.urls import path
from .views import protein_list, fetch_uniprot

urlpatterns = [
    path('proteins/', protein_list, name='protein-list'),
    path('uniprot/<str:uniprot_id>/', fetch_uniprot, name='fetch-uniprot'),
]