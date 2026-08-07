from .providers import BiomaterialProvider
from .services.pubchem import search_pubchem


class PubChemProvider(BiomaterialProvider):

    def search(self, query: str):
        print("PubChem query:", query)
        data = search_pubchem(query)
        print("PubChem result:", data)
        return data

    def get_details(self, identifier: str):
        return search_pubchem(identifier)

    def source_name(self):
        return "PubChem"