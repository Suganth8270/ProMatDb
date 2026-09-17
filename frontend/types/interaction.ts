export interface Interaction {
  id: number;

  protein: {
    id: number;
    protein_name: string;
    uniprot_id: string;
    pdb_id: string;
  };

  biomaterial: {
    id: number;
    name: string;
    category: string;
    entity_type: "biomaterial" | "drug" | "small_molecule" | null;
  };

  binding_energy: number | null;
  docking_score: number;
  interaction_type: string;
  reference: string;
}

