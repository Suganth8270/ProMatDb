import requests

from .providers import BiomaterialProvider


class ChEBIProvider(BiomaterialProvider):

    BASE_URL = "https://www.ebi.ac.uk/chebi/searchId.do"

    def search(self, name: str):
        """
        Placeholder implementation.

        In the next step we'll replace this with the official ChEBI Web Service.
        """

        return {
            "provider": "ChEBI",
            "query": name,
            "status": "ready",
        }