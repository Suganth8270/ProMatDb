from .pubchem_provider import PubChemProvider
from .chebi_provider import ChEBIProvider


class BiomaterialSearchService:

    providers = [
        PubChemProvider(),
        ChEBIProvider(),
    ]

    @classmethod
    def search(cls, query):

        print(f"Searching: {query}")

        results = []

        for provider in cls.providers:
            print(f"Provider: {provider.source_name()}")

            try:
                data = provider.search(query)

                print("Result:", data)

                if data:
                    results.append({
                        "source": provider.source_name(),
                        "data": data,
                    })

            except Exception as e:
                print("Error:", e)

        return results