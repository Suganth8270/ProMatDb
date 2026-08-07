import requests

BASE_URL = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"


def search_pubchem(query: str):
    """
    Search PubChem by compound name and return basic information.
    """

    # Resolve compound name → CID
    cid_url = f"{BASE_URL}/compound/name/{query}/cids/JSON"

    response = requests.get(cid_url, timeout=10)

    if response.status_code != 200:
        return None

    try:
        cid = response.json()["IdentifierList"]["CID"][0]
    except (KeyError, IndexError):
        return None

    # Fetch compound properties
    property_url = (
        f"{BASE_URL}/compound/cid/{cid}/property/"
        "Title,MolecularFormula,MolecularWeight/JSON"
    )

    response = requests.get(property_url, timeout=10)

    if response.status_code != 200:
        return None

    try:
        props = response.json()["PropertyTable"]["Properties"][0]

        return {
            "pubchem_cid": str(cid),
            "name": props.get("Title"),
            "molecular_formula": props.get("MolecularFormula"),
            "molecular_weight": str(props.get("MolecularWeight")),
        }

    except (KeyError, IndexError):
        return None