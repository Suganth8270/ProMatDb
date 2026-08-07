import json
import os

from .providers import BiomaterialProvider

DATA_FILE = os.path.join(
    os.path.dirname(__file__), "data", "biomaterials.json"
)


class LocalProvider(BiomaterialProvider):
    """
    Searches a curated local JSON dataset of common biomaterials.
    Acts as a fast, offline-first source before falling back to
    external providers (PubChem, ChEBI).
    """

    _cache = None

    @classmethod
    def _load_data(cls):
        if cls._cache is None:
            try:
                with open(DATA_FILE, "r", encoding="utf-8") as f:
                    cls._cache = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                cls._cache = []
        return cls._cache

    def search(self, query: str):
        if not query:
            return None

        query_lower = query.strip().lower()
        data = self._load_data()

        for entry in data:
            if entry.get("name", "").strip().lower() == query_lower:
                return entry

        # Fallback: partial match
        for entry in data:
            if query_lower in entry.get("name", "").strip().lower():
                return entry

        return None

    def get_details(self, identifier: str):
        return self.search(identifier)

    def source_name(self):
        return "Local"