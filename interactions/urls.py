from django.urls import path
from .views import interaction_list

urlpatterns = [
    path("interactions/", interaction_list, name="interaction-list"),
]
