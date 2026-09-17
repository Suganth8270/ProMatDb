export type DockingJobStatus =
  | "queued"
  | "preparing_receptor"
  | "preparing_ligand"
  | "docking"
  | "importing"
  | "completed"
  | "failed";

export interface DockingJobRequest {
  protein_id: number;
  biomaterial_id: number;
  ligand_type: "biomaterial" | "drug" | "small_molecule";
  center_x: number;
  center_y: number;
  center_z: number;
  size_x: number;
  size_y: number;
  size_z: number;
}

export interface DockingJobStatusResponse {
  id: string;
  status: DockingJobStatus;
  protein: { id: number; protein_name: string; pdb_id: string };
  biomaterial: { id: number; name: string; pubchem_cid: string };
  box: Record<"center_x" | "center_y" | "center_z" | "size_x" | "size_y" | "size_z", number>;
  error_message: string | null;
  failure_stage: string | null;
  attempt_count: number;
  last_heartbeat_at: string | null;
  lease_expires_at: string | null;
  lease_health: "healthy" | "idle" | "stale" | "not_observed" | "terminal";
  interaction_id: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  result: { interaction_url: string; artifact_metadata_url: string } | null;
}

export interface DockingWorkerHealthResponse {
  status: "healthy" | "idle" | "stale" | "not_observed";
  queued_count: number;
  active_count: number;
}
