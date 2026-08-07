import requests

from .providers import BiomaterialProvider


class ChEBIProvider(BiomaterialProvider):

    BASE_URL = "https://www.ebi.ac.uk/chebi/searchId.do"

    def search(self, query: str):
        return {
            "provider": self.source_name(),
            "query": query,
            "status": "ready",
        }

    def get_details(self, identifier: str):
        return {
            "provider": self.source_name(),
            "identifier": identifier,
            "status": "ready",
        }

    def source_name(self):
        return "ChEBI"