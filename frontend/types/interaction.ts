export interface Interaction {
  id: number;

  protein: {
    id: number;
    protein_name: string;
    uniprot_id: string;
  };

  biomaterial: {
    id: number;
    name: string;
    category: string;
  };

  binding_energy: number;
  docking_score: number;
  interaction_type: string;
  reference: string;
}