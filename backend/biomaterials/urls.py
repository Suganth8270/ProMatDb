from django.urls import path

from .views import (
    biomaterial_list,
    biomaterial_detail,
    search_biomaterial,
    import_pubchem,
    save_imported_pubchem,
)

urlpatterns = [
    path("", biomaterial_list, name="biomaterial-list"),

    path("<int:pk>/", biomaterial_detail, name="biomaterial-detail"),

    path(
        "search/",
        search_biomaterial,
        name="search-biomaterial",
    ),

    path(
        "import/<str:cid>/",
        import_pubchem,
        name="import-pubchem",
    ),

    path(
        "import/<str:cid>/save/",
        save_imported_pubchem,
        name="save-imported-pubchem",
    ),
]