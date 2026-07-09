from django.urls import path, include

urlpatterns = [
    path("", include("proteins.urls")),
    path("", include("biomaterials.urls")),
    path("", include("interactions.urls")),
]