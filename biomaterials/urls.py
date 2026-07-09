from django.urls import path
from .views import BiomaterialListAPIView

urlpatterns = [
    path("biomaterials/", BiomaterialListAPIView.as_view(), name="biomaterial-list"),
]