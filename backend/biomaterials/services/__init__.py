from ..local_provider import LocalProvider
from ..pubchem_provider import PubChemProvider
from ..chebi_provider import ChEBIProvider


class BiomaterialSearchService:

    providers = [
        LocalProvider(),
        PubChemProvider(),
        ChEBIProvider(),
    ]

    @classmethod
    def search(cls, query):
        results = []

        for provider in cls.providers:
            try:
                data = provider.search(query)

                if data:
                    results.append({
                        "source": provider.source_name(),
                        "data": data,
                    })

            except Exception:
                continue

        return results