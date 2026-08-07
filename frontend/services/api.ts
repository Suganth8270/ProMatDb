const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

import type { Biomaterial } from "@/types/biomaterial";
import type { Interaction } from "@/types/interaction";

export interface Protein {
  id: number;
  protein_name: string;
  uniprot_id: string;
  pdb_id: string;
  organism: string;
  sequence: string;
  molecular_weight: number;
  function: string;
}

export interface SearchResult {
  query: string;
  proteins: {
    id: number;
    protein_name: string;
    uniprot_id: string;
    pdb_id: string;
    organism: string;
  }[];
  biomaterials: {
    id: number;
    name: string;
    category: string;
    source: string;
  }[];
  interactions: {
    id: number;
    protein: string;
    biomaterial: string;
    interaction_type: string;
    binding_energy: number;
    docking_score: number;
    reference: string;
  }[];
}

interface ProteinResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Protein[];
}

interface BiomaterialResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Biomaterial[];
}

export async function getProteins(): Promise<Protein[]> {
  const response = await fetch(`${API_BASE_URL}/proteins/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch proteins.");
  }

const data: Protein[] = await response.json();
return data;
}

export async function getProtein(id: string | number): Promise<Protein> {
  const response = await fetch(`${API_BASE_URL}/proteins/${id}/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch protein.");
  }

  return response.json();
}

export async function getBiomaterials(): Promise<Biomaterial[]> {
  const response = await fetch(`${API_BASE_URL}/biomaterials/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch biomaterials.");
  }

  return response.json();
}

export async function getBiomaterial(
  id: string | number
): Promise<Biomaterial> {
  const response = await fetch(`${API_BASE_URL}/biomaterials/${id}/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch biomaterial.");
  }

  return response.json();
}

export async function getInteractions(): Promise<Interaction[]> {
  const response = await fetch(`${API_BASE_URL}/interactions/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch interactions.");
  }

  return response.json();
}

export async function getInteraction(
  id: string | number
): Promise<Interaction> {
  const response = await fetch(`${API_BASE_URL}/interactions/${id}/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch interaction.");
  }

  return response.json();
}

export async function search(query: string): Promise<SearchResult> {
  const response = await fetch(
    `${API_BASE_URL}/search/?q=${encodeURIComponent(query)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to perform search.");
  }

  return response.json();
}

export async function fetchUniProt(uniprotId: string) {
  const response = await fetch(
    `${API_BASE_URL}/proteins/uniprot/${uniprotId}/`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch UniProt protein.");
  }

  return response.json();
}

export async function importUniProt(uniprotId: string) {
  const response = await fetch(
    `${API_BASE_URL}/proteins/import/${uniprotId}/`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to import protein.");
  }

  return response.json();
}

export async function fetchPDB(pdbId: string) {
  const response = await fetch(
    `${API_BASE_URL}/proteins/pdb/${pdbId}/`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch PDB.");
  }

  return response.json();
}

export async function linkPDB(
  uniprotId: string,
  pdbId: string
) {
  const response = await fetch(
    `${API_BASE_URL}/proteins/link-pdb/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uniprot_id: uniprotId,
        pdb_id: pdbId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to link PDB.");
  }

  return response.json();
}

export async function importFASTA(
  header: string,
  sequence: string
) {
  const response = await fetch(
    `${API_BASE_URL}/import-fasta/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        header,
        sequence,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to import FASTA.");
  }

  return response.json();
}

export async function getDashboardStats() {
  const response = await fetch(
    `${API_BASE_URL}/dashboard-stats/`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard statistics.");
  }

  return response.json();
}

export async function fetchPubChem(cid: string) {
  const res = await fetch(
    `${API_BASE_URL}/biomaterials/import/${cid}/`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch biomaterial.");
  }

  return res.json();
}

export async function importPubChem(cid: string) {
  const res = await fetch(
    `${API_BASE_URL}/biomaterials/import/${cid}/save/`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to import biomaterial.");
  }

  return res.json();
}

