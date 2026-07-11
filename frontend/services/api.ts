const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

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

interface ProteinResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Protein[];
}

export async function getProteins(): Promise<Protein[]> {
  const response = await fetch(`${API_BASE_URL}/proteins/`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch proteins.");
  }

  const data: ProteinResponse = await response.json();

  return data.results;
}