from django.urls import path, include
from . import views

urlpatterns = [
    path("proteins/", include("proteins.urls")),
    path("biomaterials/", include("biomaterials.urls")),
    path("interactions/", include("interactions.urls")),

    path("search/", views.global_search, name="global-search"),
    path("dashboard-stats/", views.dashboard_stats, name="dashboard-stats"),
]