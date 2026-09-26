const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

import type { Biomaterial } from "@/types/biomaterial";
import type { Interaction } from "@/types/interaction";

import type {
  DockingJobRequest,
  DockingJobStatusResponse,
  DockingWorkerHealthResponse,
} from "@/types/docking";

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

export async function getBiomaterials(
  entityType?: "biomaterial" | "drug" | "small_molecule"
): Promise<Biomaterial[]> {
  const query = entityType
    ? `?entity_type=${encodeURIComponent(entityType)}`
    : "";

  const response = await fetch(
    `${API_BASE_URL}/biomaterials/${query}`,
    {
      cache: "no-store",
    }
  );

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
    credentials: "include",
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
    credentials: "include",
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
  const csrf = await getCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/proteins/import/${uniprotId}/`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrf.csrfToken,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "UniProt import failed:",
      response.status,
      errorText
    );

    throw new Error(
      `Failed to import protein (${response.status}): ${errorText}`
    );
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
  const csrf = await getCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/proteins/link-pdb/`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf.csrfToken,
      },
      body: JSON.stringify({
        uniprot_id: uniprotId,
        pdb_id: pdbId,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "PDB linking failed:",
      response.status,
      errorText
    );

    throw new Error(
      `Failed to link PDB (${response.status}): ${errorText}`
    );
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

export async function submitDockingJob(
  payload: DockingJobRequest
): Promise<DockingJobStatusResponse> {
  const csrf = await getCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/interactions/docking-jobs/`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf.csrfToken,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Failed to submit docking job."
    );
  }

  return data as DockingJobStatusResponse;
}

export async function getDockingJob(
  jobId: string
): Promise<DockingJobStatusResponse> {
  const response = await fetch(
    `${API_BASE_URL}/interactions/docking-jobs/${jobId}/`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Failed to fetch docking job."
    );
  }

  return data as DockingJobStatusResponse;
}

export async function getDockingWorkerHealth(): Promise<DockingWorkerHealthResponse> {
  const response = await fetch(
    `${API_BASE_URL}/interactions/docking-worker/health/`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Failed to fetch docking worker health."
    );
  }

  return data as DockingWorkerHealthResponse;
}

export async function getAuthSession() {
  const response = await fetch(
    `${API_BASE_URL}/auth/session/`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch session.");
  }

  return response.json();
}

export async function getCsrfToken() {
  const response = await fetch(
    `${API_BASE_URL}/auth/csrf/`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to initialize session.");
  }

  return response.json();
}

export async function login(
  username: string,
  password: string
) {
  const csrf = await getCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/auth/login/`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf.csrfToken,
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Login failed.");
  }

  return data;
}

export async function logout() {
  const csrf = await getCsrfToken();

  const response = await fetch(
    `${API_BASE_URL}/auth/logout/`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrf.csrfToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Logout failed.");
  }

  return response.json();
}

export interface DockingPose {
  pose: number;
  affinity_kcal_per_mol: number;
  rmsd_lower_bound: number;
  rmsd_upper_bound: number;
  atom_count: number;
}

export interface DockingArtifacts {
  interaction_id: number;
  receptor_pdb_id: string;
  pubchem_cid: string;
  pose_count: number;
  best_affinity_kcal_per_mol: number;
  poses: DockingPose[];
  sdf_available: boolean;
  pdbqt_filename: string;
  log_filename: string;
}

export async function getDockingArtifacts(
  interactionId: string | number
): Promise<DockingArtifacts> {
  const response = await fetch(
    `${API_BASE_URL}/interactions/${interactionId}/artifacts/metadata/`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "Failed to fetch docking artifacts."
    );
  }

  return data;
}

export function getDockingArtifactUrl(
  interactionId: string | number,
  artifactType: "sdf" | "pdbqt" | "log"
): string {
  return `${API_BASE_URL}/interactions/${interactionId}/artifacts/${artifactType}/`;
}
