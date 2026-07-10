from django.urls import path
from .views import biomaterial_list, biomaterial_detail

urlpatterns = [
    path("biomaterials/", biomaterial_list, name="biomaterial-list"),
    path("biomaterials/<int:pk>/", biomaterial_detail, name="biomaterial-detail"),
]