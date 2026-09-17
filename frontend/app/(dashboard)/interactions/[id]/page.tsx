// ============================================================================
// ProMatDB - Interaction Details Page (Professional Redesign)
// File: frontend/app/(dashboard)/interactions/[id]/page.tsx
// ============================================================================

"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  SearchX,
  Dna,
  Leaf,
  Zap,
  Target,
  Tag,
  FileText,
  ExternalLink,
} from "lucide-react";

import { useFetch } from "@/hooks/useFetch";
import { getInteraction } from "@/services/api";
import type { Interaction } from "@/types/interaction";

const DockingStructureViewer = dynamic(
  () => import("@/components/interaction/DockingStructureViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] sm:h-96">
        Loading docking structure viewer...
      </div>
    ),
  }
);

interface DockingPose {
  pose: number;
  affinity_kcal_per_mol: number;
  rmsd_lower_bound: number;
  rmsd_upper_bound: number;
  atom_count: number;
}

interface DockingArtifactMetadata {
  receptor_pdb_id: string;
  pubchem_cid: number;
  pose_count: number;
  best_affinity_kcal_per_mol: number;
  poses: DockingPose[];
  sdf_available: boolean;
  pdbqt_filename: string;
  log_filename: string;
}

function BackLink() {
  return (
    <Link
      href="/interactions"
      className="inline-flex items-center gap-2 font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
    >
      <ArrowLeft size={18} /> Back to Interactions
    </Link>
  );
}

/** Matches http:// or https:// URLs only. Anything else stays plain text. */
function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/**
 * UI-only sanitization: removes server filesystem paths (Windows or Linux
 * absolute paths) from text before it is rendered in the browser, while
 * preserving any other scientific run metadata present in the same string
 * (e.g. AutoDock Vina version, seed, exhaustiveness, CPU, box center/size,
 * output format). This does not touch how the value is stored or fetched;
 * it only affects what is displayed.
 */
function stripFilesystemPaths(value: string): string {
  if (!value) return value;

  // Protect any http(s) URLs first so the path-stripping patterns below
  // never touch legitimate links (e.g. the "//" following "https:").
  const preservedUrls: string[] = [];
  const withUrlsMasked = value.replace(/https?:\/\/[^\s,;]+/gi, (match) => {
    preservedUrls.push(match);
    return `\u0000URL${preservedUrls.length - 1}\u0000`;
  });

  // Windows-style absolute paths, e.g. D:\ProMatDB\backend\docking_data\...
  const windowsPathPattern = /[A-Za-z]:[\\/][^\s,;]*/g;
  // Linux/Unix-style absolute paths, e.g. /var/app/docking_data/...
  const unixPathPattern = /\/(?:[^\s,;/]+\/)*[^\s,;/]*/g;

  let sanitized = withUrlsMasked
    .replace(windowsPathPattern, "")
    .replace(unixPathPattern, "");

  preservedUrls.forEach((url, index) => {
    sanitized = sanitized.replace(`\u0000URL${index}\u0000`, url);
  });

  return sanitized
    // Collapse leftover separator artifacts created by path removal.
    .replace(/[ \t]{2,}/g, " ")
    .replace(/(,\s*){2,}/g, ", ")
    .replace(/\s*,\s*(?=[,)\n]|$)/g, "")
    .replace(/^[\s,;-]+|[\s,;-]+$/g, "")
    .trim();
}

function entityTypeLabel(entityType: Interaction["biomaterial"]["entity_type"]): string {
  if (entityType === "biomaterial") return "Biomaterial";
  if (entityType === "drug") return "Drug";
  if (entityType === "small_molecule") return "Small Molecule";
  return "Unclassified";
}

export default function InteractionDetailsPage() {
  const params = useParams();
  const id = params.id;
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
  const [artifactMetadata, setArtifactMetadata] =
    useState<DockingArtifactMetadata | null>(null);
  const [artifactError, setArtifactError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchArtifactMetadata() {
      try {
        const response = await fetch(
          `${apiBaseUrl}/interactions/${id}/artifacts/metadata/`,
          { credentials: "include", cache: "no-store" }
        );
        if (!response.ok) throw new Error("Docking artifacts unavailable");
        const data: DockingArtifactMetadata = await response.json();
        if (!cancelled) setArtifactMetadata(data);
      } catch {
        if (!cancelled) setArtifactError("Docking artifacts are not available.");
      }
    }
    if (id) fetchArtifactMetadata();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, id]);

  const artifactUrl = (artifactType: "pdbqt" | "log" | "sdf") =>
    `${apiBaseUrl}/interactions/${id}/artifacts/${artifactType}/`;

  const fetchInteraction = useCallback(
    () => getInteraction(id as string),
    [id]
  );

  const {
    data: interaction,
    loading,
    error,
  } = useFetch<Interaction>(fetchInteraction);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
            <div className="space-y-3">
              <div className="h-4 w-40 rounded bg-[var(--color-surface-soft)]" />
              <div className="h-9 w-96 rounded bg-[var(--color-surface-soft)]" />
              <div className="h-4 w-72 rounded bg-[var(--color-surface-soft)]" />
              <div className="mt-4 flex gap-3">
                <div className="h-8 w-28 rounded-full bg-[var(--color-surface-soft)]" />
                <div className="h-8 w-28 rounded-full bg-[var(--color-surface-soft)]" />
                <div className="h-8 w-28 rounded-full bg-[var(--color-surface-soft)]" />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="h-44 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" />
            <div className="h-44 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" />
            <div className="h-44 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" />
            <div className="h-44 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-6 text-[var(--color-danger)]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" />
            <div>
              <p className="font-semibold">Unable to load interaction</p>
              <p className="mt-1 text-sm text-[var(--color-danger)]">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-20 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-soft)]">
              <SearchX className="h-7 w-7 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--color-text)]">
              Interaction not found
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">
              We couldn&apos;t find an interaction with this ID. It may have
              been removed or the link may be incorrect.
            </p>
            <Link
              href="/interactions"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <ArrowLeft size={16} /> Back to Interactions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const referenceIsUrl = Boolean(interaction.reference) && isHttpUrl(interaction.reference);
  const isVinaResult = interaction.interaction_type === "AutoDock Vina";
  const dockingLabel = isVinaResult ? "Vina Affinity" : "Docking Score";
  const dockingValue = isVinaResult
    ? `${interaction.docking_score} kcal/mol`
    : interaction.docking_score;

  // Best pose is the existing pose with the minimum affinity_kcal_per_mol.
  // No coordinate mapping or pose selection is derived here.
  const bestPose =
    artifactMetadata && artifactMetadata.poses.length > 0
      ? artifactMetadata.poses.reduce((best, pose) =>
          pose.affinity_kcal_per_mol < best.affinity_kcal_per_mol ? pose : best
        )
      : null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8">
      <div className="mx-auto max-w-6xl">

        <BackLink />

        {/* Record header */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">

          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-soft)] px-8 py-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-indigo)]" />
              Interaction Record
            </span>
            <span className="font-data text-xs font-semibold text-[var(--color-text-muted)]">
              #{interaction.id}
            </span>
          </div>

          <div className="p-8">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
              Protein&ndash;Biomaterial Interaction
            </h1>
            <p className="mt-2 text-base text-[var(--color-text-secondary)]">
              Documented interaction between a protein and biomaterial in ProMatDB.
            </p>

            {/* At-a-glance data badges */}
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-[var(--color-indigo)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-indigo)]">
                Type: {interaction.interaction_type || "Not specified"}
              </span>
              <span className="rounded-full bg-[var(--color-emerald)]/10 px-4 py-2 font-data text-sm font-semibold text-[var(--color-emerald)]">
                {dockingLabel}: {dockingValue}
              </span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-2 font-data text-sm font-semibold text-[var(--color-text)]">
                Binding Energy: {interaction.binding_energy === null ? "Not available" : interaction.binding_energy}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Protein */}
            <section className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[var(--color-primary)]/10 p-2">
                  <Dna className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Protein</h2>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Name
                  </p>
                  <p className="mt-1 text-[var(--color-text)]">
                    {interaction.protein.protein_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    UniProt ID
                  </p>
                  <p className="mt-1 font-data text-sm font-semibold text-[var(--color-text)]">
                    {interaction.protein.uniprot_id}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/proteins/${interaction.protein.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
                >
                  View Protein <ArrowRight size={16} />
                </Link>
              </div>
            </section>

            {/* Biomaterial */}
            <section className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[var(--color-emerald)]/10 p-2">
                  <Leaf className="h-4 w-4 text-[var(--color-emerald)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">{entityTypeLabel(interaction.biomaterial.entity_type)}</h2>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Name
                  </p>
                  <p className="mt-1 text-[var(--color-text)]">
                    {interaction.biomaterial.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                    Category
                  </p>
                  <p className="mt-1 font-data text-sm font-semibold text-[var(--color-text)]">
                    {interaction.biomaterial.category}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href={`/biomaterials/${interaction.biomaterial.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-emerald)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
                >
                  View Biomaterial <ArrowRight size={16} />
                </Link>
              </div>
            </section>

          </div>

          {/* Docking Results */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-[var(--color-indigo)]/10 p-2">
                <Target className="h-4 w-4 text-[var(--color-indigo)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Docking Results</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[var(--color-warning)]" />
                  <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                    Binding Energy
                  </span>
                </div>
                <p className="mt-2 font-data text-lg font-bold text-[var(--color-text)]">
                  {interaction.binding_energy === null ? "Not available" : interaction.binding_energy}
                </p>
              </div>

              <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--color-violet)]" />
                  <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                    {dockingLabel}
                  </span>
                </div>
                <p className="mt-2 font-data text-lg font-bold text-[var(--color-text)]">
                  {dockingValue}
                </p>
              </div>

              <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[var(--color-indigo)]" />
                  <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                    Interaction Type
                  </span>
                </div>
                <p className="mt-2 font-data text-lg font-bold text-[var(--color-text)]">
                  {interaction.interaction_type || "Not specified"}
                </p>
              </div>
            </div>
          </section>

          {/* Read-only docking artifacts and pose metadata */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Docking Artifacts</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Read-only files and pose metadata from the verified Vina run.
                </p>
              </div>
              {artifactMetadata && (
                <span className="rounded-full bg-[var(--color-indigo)]/10 px-3 py-1 font-data text-xs font-semibold text-[var(--color-indigo)]">
                  {artifactMetadata.pose_count} poses
                </span>
              )}
            </div>

            {artifactError && (
              <p className="mt-4 text-sm text-[var(--color-text-muted)]">{artifactError}</p>
            )}

            {artifactMetadata && (
              <div className="mt-5 space-y-5">
                {/* Scientific disclaimer */}
                <div className="flex items-start gap-3 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" />
                  <p className="text-xs leading-5 text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text)]">Scientific note:</span>{" "}
                    Docking affinity and pose rankings are computational results and do not by
                    themselves biologically validate the binding site, binding mode, or
                    experimental interaction.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {bestPose && (
                    <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        Best pose
                      </p>
                      <p className="mt-2 font-data text-lg font-bold text-[var(--color-text)]">
                        Pose {bestPose.pose}
                      </p>
                    </div>
                  )}
                  <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Best Vina affinity
                    </p>
                    <p className="mt-2 font-data text-lg font-bold text-[var(--color-text)]">
                      {artifactMetadata.best_affinity_kcal_per_mol} kcal/mol
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Pose count
                    </p>
                    <p className="mt-2 font-data text-lg font-bold text-[var(--color-text)]">
                      {artifactMetadata.pose_count}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Receptor PDB ID
                    </p>
                    <p className="mt-2 font-data text-lg font-bold text-[var(--color-text)]">
                      {artifactMetadata.receptor_pdb_id}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      Ligand PubChem CID
                    </p>
                    <p className="mt-2 font-data text-lg font-bold text-[var(--color-text)]">
                      {artifactMetadata.pubchem_cid}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-surface-soft)] p-4">
                    <a
                      href={artifactUrl("pdbqt")}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      Download PDBQT
                    </a>
                    <a
                      href={artifactUrl("log")}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      Download Vina log
                    </a>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                    Existing Vina poses
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="bg-[var(--color-surface-soft)] text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                        <tr>
                          <th className="px-4 py-3">Pose</th>
                          <th className="px-4 py-3">Affinity</th>
                          <th className="px-4 py-3">RMSD lower</th>
                          <th className="px-4 py-3">RMSD upper</th>
                          <th className="px-4 py-3">Atoms</th>
                        </tr>
                      </thead>
                      <tbody>
                        {artifactMetadata.poses.map((pose) => {
                          const isBestPose = bestPose?.pose === pose.pose;
                          return (
                            <tr
                              key={pose.pose}
                              className={`border-t border-[var(--color-border-soft)] text-[var(--color-text-secondary)] ${
                                isBestPose ? "bg-[var(--color-emerald)]/10" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-data font-semibold text-[var(--color-text)]">
                                <span className="inline-flex items-center gap-2">
                                  {pose.pose}
                                  {isBestPose && (
                                    <span className="rounded-full bg-[var(--color-emerald)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-emerald)]">
                                      Best
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-data">{pose.affinity_kcal_per_mol} kcal/mol</td>
                              <td className="px-4 py-3 font-data">{pose.rmsd_lower_bound}</td>
                              <td className="px-4 py-3 font-data">{pose.rmsd_upper_bound}</td>
                              <td className="px-4 py-3 font-data">{pose.atom_count}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {artifactMetadata.sdf_available ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                      Docked pose visualization
                    </p>
                    <DockingStructureViewer
                      pdbId={artifactMetadata.receptor_pdb_id}
                      ligandSdfUrl={artifactUrl("sdf")}
                      height="34rem"
                    />
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    A chemically faithful SDF export is not available. The original PDBQT, log, and pose metadata remain available above.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Evidence & Reference */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-[var(--color-primary)]/10 p-2">
                <FileText className="h-4 w-4 text-[var(--color-primary)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">Evidence &amp; Reference</h2>
            </div>

            <div className="mt-4">
              {interaction.reference ? (
                referenceIsUrl ? (
                  <a
                    href={interaction.reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 break-all text-sm font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    <ExternalLink size={14} className="shrink-0" />
                    {stripFilesystemPaths(interaction.reference)}
                  </a>
                ) : (
                  <p className="break-words leading-7 text-[var(--color-text-secondary)]">
                    {stripFilesystemPaths(interaction.reference)}
                  </p>
                )
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No reference provided.
                </p>
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}