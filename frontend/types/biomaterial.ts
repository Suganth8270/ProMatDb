export interface Biomaterial {
  id: number;

  name: string;
  category: string;
  entity_type: "biomaterial" | "drug" | "small_molecule" | null;
  source: string;

  description: string;
  applications: string;

  pubchem_cid: string;
  chebi_id: string;

  molecular_formula: string;
  molecular_weight: string;
  chemical_type: string;

  biocompatibility: string;
  biodegradability: string;
  mechanical_strength: string;
  thermal_stability: string;

  image_url: string;
  structure_image: string;
  sem_image: string;

  doi: string;
  pubmed_url: string;

  created_at: string;
  updated_at: string;
}