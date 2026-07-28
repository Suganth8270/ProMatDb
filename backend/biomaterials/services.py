import requests


class BiomaterialSearchService:

    PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"

    @classmethod
    def search(cls, name):

        try:
            url = (
                f"{cls.PUBCHEM_BASE}/compound/name/"
                f"{name}/property/"
                "MolecularFormula,MolecularWeight,IUPACName/JSON"
            )

            response = requests.get(url, timeout=15)

            if response.status_code != 200:
                return None

            data = response.json()

            properties = data["PropertyTable"]["Properties"][0]

            return {
                "name": name,
                "pubchem_id": properties.get("CID"),
                "formula": properties.get("MolecularFormula"),
                "weight": properties.get("MolecularWeight"),
                "iupac_name": properties.get("IUPACName"),
            }

        except Exception:
            return None