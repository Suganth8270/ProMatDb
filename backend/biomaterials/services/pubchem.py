import requests

BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"


def search_pubchem(cid: str):
    """
    Fetch biomaterial information from PubChem using CID.
    """

    url = (
        f"{BASE_URL}/compound/cid/{cid}/property/"
        "Title,MolecularFormula,MolecularWeight/JSON"
    )

    response = requests.get(url, timeout=10)

    if response.status_code != 200:
        return None

    data = response.json()

    try:
        props = data["PropertyTable"]["Properties"][0]

        return {
            "pubchem_cid": cid,
            "name": props.get("Title"),
            "molecular_formula": props.get("MolecularFormula"),
            "molecular_weight": str(props.get("MolecularWeight")),
        }

    except (KeyError, IndexError):
        return None