from django.urls import path
from .views import interaction_list, interaction_detail

urlpatterns = [
    path("interactions/", interaction_list, name="interaction-list"),
    path("interactions/<int:pk>/", interaction_detail, name="interaction-detail"),
]