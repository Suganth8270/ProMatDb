"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import DockingBoxViewer from "@/components/docking/DockingBoxViewer";

import {
  getBiomaterials,
  getDockingJob,
  getDockingWorkerHealth,
  getProteins,
  submitDockingJob,
} from "@/services/api";
import type { Protein } from "@/services/api";
import type { Biomaterial } from "@/types/biomaterial";
import type {
  DockingJobRequest,
  DockingJobStatusResponse,
  DockingWorkerHealthResponse,
} from "@/types/docking";

const SESSION_KEY = "promatdb.active_docking_job_id";
const ACTIVE_STATES = new Set(["queued", "preparing_receptor", "preparing_ligand", "docking", "importing"]);
const BOX_KEYS = ["center_x", "center_y", "center_z", "size_x", "size_y", "size_z"] as const;
type BoxKey = (typeof BOX_KEYS)[number];

export default function DockingPage() {
  const [proteins, setProteins] = useState<Protein[]>([]);
  const [biomaterials, setBiomaterials] = useState<Biomaterial[]>([]);
  const [proteinId, setProteinId] = useState("");
  const [biomaterialId, setBiomaterialId] = useState("");
  const [ligandType, setLigandType] = useState<"biomaterial" | "drug" | "small_molecule">("biomaterial");
  const [box, setBox] = useState<Record<BoxKey, string>>({ center_x: "", center_y: "", center_z: "", size_x: "", size_y: "", size_z: "" });
  const [job, setJob] = useState<DockingJobStatusResponse | null>(null);
  const [health, setHealth] = useState<DockingWorkerHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refreshHealth = async () => {
      try {
        const nextHealth = await getDockingWorkerHealth();
        if (mounted) setHealth(nextHealth);
      } catch {
        if (mounted) setHealth(null);
      }
    };
    Promise.all([getProteins(), getBiomaterials(ligandType)])
      .then(([proteinData, biomaterialData]) => {
        if (!mounted) return;
        setProteins(proteinData);
        setBiomaterials(biomaterialData);
        const stored = window.sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          setRecovered(true);
          return getDockingJob(stored).then((recoveredJob) => {
            if (mounted) setJob(recoveredJob);
          }).catch(() => {
            window.sessionStorage.removeItem(SESSION_KEY);
          });
        }
      })
      .catch((exc: Error) => mounted && setError(exc.message))
      .finally(() => mounted && setLoading(false));
    void refreshHealth();
    const healthTimer = window.setInterval(() => void refreshHealth(), 5000);
    return () => { mounted = false; window.clearInterval(healthTimer); };
  }, [ligandType]);

  const activeJobId = job?.id;
  const activeJobStatus = job?.status;

  useEffect(() => {
    if (!activeJobId || !activeJobStatus || !ACTIVE_STATES.has(activeJobStatus)) return;
    const timer = window.setInterval(() => {
      void getDockingJob(activeJobId).then(setJob).catch((exc: Error) => setError(exc.message));
    }, 2000);
    return () => window.clearInterval(timer);
  }, [activeJobId, activeJobStatus]);

  useEffect(() => {
    if (!job) return;
    if (ACTIVE_STATES.has(job.status)) window.sessionStorage.setItem(SESSION_KEY, job.id);
    else window.sessionStorage.removeItem(SESSION_KEY);
  }, [job]);

  const selectedProtein = useMemo(() => proteins.find((item) => String(item.id) === proteinId), [proteins, proteinId]);
  const selectedBiomaterial = useMemo(() => biomaterials.find((item) => String(item.id) === biomaterialId), [biomaterials, biomaterialId]);
  const parsedBox = Object.fromEntries(BOX_KEYS.map((key) => [key, Number(box[key])])) as Record<(typeof BOX_KEYS)[number], number>;
  const centerValuesValid = (['center_x', 'center_y', 'center_z'] as const).every(
    (key) => Number.isFinite(parsedBox[key]) && parsedBox[key] >= -1000 && parsedBox[key] <= 1000,
  );
  const sizeValuesValid = (['size_x', 'size_y', 'size_z'] as const).every(
    (key) => Number.isFinite(parsedBox[key]) && parsedBox[key] > 0 && parsedBox[key] <= 100,
  );
  const boxValuesValid = centerValuesValid && sizeValuesValid;
  const proteinEligible = Boolean(selectedProtein?.pdb_id?.trim());
  const ligandCid = selectedBiomaterial?.pubchem_cid?.trim() ?? "";
  const ligandEligible = /^\d+$/.test(ligandCid);
  const eligibility = {
    protein: proteinEligible,
    ligand: ligandEligible,
    classification: Boolean(selectedBiomaterial && selectedBiomaterial.entity_type === ligandType),
    box: boxValuesValid,
  };
  const reviewReady = Boolean(selectedProtein && selectedBiomaterial && Object.values(eligibility).every(Boolean));

  const selectionKey = `${proteinId}|${ligandType}|${biomaterialId}|${BOX_KEYS.map((key) => box[key]).join("|")}`;
  const [confirmedSelectionKey, setConfirmedSelectionKey] = useState("");
  const confirmationIsCurrent = confirmedSelectionKey === selectionKey;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!reviewReady || !confirmed || !confirmationIsCurrent) {
        setError("Review and confirmation are required before submission.");
        return;
      }
      const payload: Omit<DockingJobRequest, "protein_id" | "biomaterial_id" | "ligand_type"> = {
        center_x: Number(box.center_x),
        center_y: Number(box.center_y),
        center_z: Number(box.center_z),
        size_x: Number(box.size_x),
        size_y: Number(box.size_y),
        size_z: Number(box.size_z),
      };
      const created = await submitDockingJob({ protein_id: Number(proteinId), biomaterial_id: Number(biomaterialId), ligand_type: ligandType, ...payload });
      setJob(created);
      setRecovered(false);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Unable to submit docking job.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="p-8">Loading docking workspace…</main>;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-8 text-[var(--color-text)]">
      <header>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Docking workspace</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Select the ligand type and classified ligand first. The docking box defines the region searched by Vina; numerically valid values are not automatically scientifically appropriate.</p>
      </header>
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Worker health</h2>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-1 text-sm text-[var(--color-text-secondary)]">{health?.status ?? "not_observed"}</span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">Queued: {health?.queued_count ?? "—"} · Active: {health?.active_count ?? "—"}</p>
      </section>
      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-[var(--color-text)]">{error}</div>}
      <section className="space-y-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Review and confirm</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Review the exact records and coordinates that will be submitted.</p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-[var(--color-text-secondary)]">Protein</dt><dd>{selectedProtein ? `${selectedProtein.protein_name} (database ID ${selectedProtein.id})` : "Not selected"}</dd></div>
          <div><dt className="font-semibold text-[var(--color-text-secondary)]">PDB ID</dt><dd>{selectedProtein?.pdb_id || "Not available"}</dd></div>
          <div><dt className="font-semibold text-[var(--color-text-secondary)]">Ligand class</dt><dd>{ligandType === "biomaterial" ? "Biomaterial" : ligandType === "drug" ? "Drug" : "Small Molecule"}</dd></div>
          <div><dt className="font-semibold text-[var(--color-text-secondary)]">Ligand</dt><dd>{selectedBiomaterial ? `${selectedBiomaterial.name} (database ID ${selectedBiomaterial.id})` : "Not selected"}</dd></div>
          <div><dt className="font-semibold text-[var(--color-text-secondary)]">Ligand classification</dt><dd>{selectedBiomaterial?.entity_type === "biomaterial" ? "Biomaterial" : selectedBiomaterial?.entity_type === "drug" ? "Drug" : selectedBiomaterial?.entity_type === "small_molecule" ? "Small Molecule" : "Unclassified"}</dd></div>
          <div><dt className="font-semibold text-[var(--color-text-secondary)]">PubChem CID</dt><dd>{selectedBiomaterial?.pubchem_cid || "Not available"}</dd></div>
          <div><dt className="font-semibold text-[var(--color-text-secondary)]">Box center (Å)</dt><dd>{box.center_x || "—"}, {box.center_y || "—"}, {box.center_z || "—"}</dd></div>
          <div><dt className="font-semibold text-[var(--color-text-secondary)]">Box size (Å)</dt><dd>{box.size_x || "—"} × {box.size_y || "—"} × {box.size_z || "—"}</dd></div>
        </dl>
        <div className="space-y-1 text-sm text-[var(--color-text-secondary)]">
          <p>Eligibility: {eligibility.protein ? "Protein PDB ID present" : "Protein with a usable PDB ID required"}; {eligibility.ligand ? "numeric PubChem CID present" : "numeric PubChem CID required"}; {eligibility.classification ? "classification matches ligand type" : "classification must match ligand type"}; {eligibility.box ? "box is within backend bounds" : "center must be within ±1000 Å and each size must be greater than 0 and no more than 100 Å"}.</p>
          <p className="font-medium">These are eligibility and input checks only; they do not validate a biological binding pocket.</p>
          <p>Docking box coordinates are explicitly selected by the researcher. ProMatDB validates numerical bounds but does not automatically determine or validate the biological binding pocket.</p>
        </div>
        <label className="flex items-start gap-3 text-sm text-[var(--color-text)]">
          <input type="checkbox" checked={confirmed && confirmationIsCurrent} onChange={(event) => { setConfirmed(event.target.checked); setConfirmedSelectionKey(event.target.checked ? selectionKey : ""); }} disabled={!reviewReady} className="mt-1 h-4 w-4" />
          <span>I have reviewed the selected protein, ligand, ligand class, and docking-box coordinates. I understand that the docking box is researcher-selected and is not automatically validated as a biological binding site.</span>
        </label>
      </section>
      <DockingBoxViewer pdbId={selectedProtein?.pdb_id?.trim() || null} />
      <form onSubmit={submit} className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-[var(--color-text)] shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm"><span>Protein</span><select required value={proteinId} onChange={(event) => setProteinId(event.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"><option value="">Select a protein</option>{proteins.map((item) => <option key={item.id} value={item.id}>{item.protein_name} {item.pdb_id ? `(${item.pdb_id})` : "(no PDB)"}</option>)}</select></label>
          <label className="space-y-1 text-sm"><span>Ligand type</span><select required value={ligandType} onChange={(event) => { setLigandType(event.target.value as typeof ligandType); setBiomaterialId(""); }} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"><option value="biomaterial">Biomaterial</option><option value="drug">Drug</option><option value="small_molecule">Small Molecule</option></select></label>
          <label className="space-y-1 text-sm"><span>{ligandType === "biomaterial" ? "Select biomaterial" : ligandType === "drug" ? "Select drug" : "Select small molecule"}</span><select required value={biomaterialId} onChange={(event) => setBiomaterialId(event.target.value)} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"><option value="">Select a ligand</option>{biomaterials.map((item) => <option key={item.id} value={item.id}>{item.name} (CID {item.pubchem_cid})</option>)}</select></label>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">Selected: {selectedProtein?.pdb_id || "no PDB ID"} · CID {selectedBiomaterial?.pubchem_cid || "—"}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {BOX_KEYS.map((key) => <label key={key} className="space-y-1 text-sm"><span>{key.replace("_", " ")}</span><input required type="number" step="any" value={box[key]} onChange={(event) => setBox((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-2 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]" /></label>)}
        </div>
        <button disabled={submitting || !reviewReady || !confirmed} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit docking job"}</button>
      </form>
      {job && <section className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold text-[var(--color-text)]">Job {job.id}</h2><span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-1 text-sm text-[var(--color-text-secondary)]">{job.status}</span></div>{recovered && <p className="text-sm text-[var(--color-primary)]">Recovered this job after page refresh.</p>}<p className="text-sm">Attempt {job.attempt_count} · lease {job.lease_health}{job.last_heartbeat_at ? ` · heartbeat ${new Date(job.last_heartbeat_at).toLocaleTimeString()}` : ""}</p>{job.failure_stage && <p className="text-sm text-[var(--color-text)]">Failure stage: {job.failure_stage}</p>}{job.error_message && <p className="text-sm text-[var(--color-text)]">{job.error_message}</p>}{job.result && <p className="text-sm"><a className="text-[var(--color-primary)] underline" href={job.result.interaction_url}>View interaction {job.interaction_id}</a> · <a className="text-[var(--color-primary)] underline" href={job.result.artifact_metadata_url}>View artifacts</a></p>}</section>}
    </main>
  );
}
