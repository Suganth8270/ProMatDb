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

export interface ProteinResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Protein[];
}