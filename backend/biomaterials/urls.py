from django.urls import path

from .views import (
    biomaterial_list,
    biomaterial_detail,
    search_biomaterial,
    import_pubchem,
    save_imported_pubchem,
    manual_import_biomaterial,
)

urlpatterns = [
    # List all biomaterials
    path(
        "",
        biomaterial_list,
        name="biomaterial-list",
    ),

    # Search biomaterials
    path(
        "search/",
        search_biomaterial,
        name="search-biomaterial",
    ),

    # Manual biomaterial import
    path(
        "manual-import/",
        manual_import_biomaterial,
        name="manual-import-biomaterial",
    ),

    # Biomaterial detail
    path(
        "<int:pk>/",
        biomaterial_detail,
        name="biomaterial-detail",
    ),

    # Import from PubChem
    path(
        "import/<str:cid>/",
        import_pubchem,
        name="import-pubchem",
    ),

    # Save imported biomaterial
    path(
        "import/<str:cid>/save/",
        save_imported_pubchem,
        name="save-imported-pubchem",
    ),
]