"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Atom,
  ChevronDown,
  Loader2,
  Target,
  Trophy,
} from "lucide-react";

import {
  getDockingArtifacts,
  type DockingArtifacts,
} from "@/services/api";

interface DockingResultsPanelProps {
  interactionId: number;
}

export default function DockingResultsPanel({
  interactionId,
}: DockingResultsPanelProps) {
  const [artifacts, setArtifacts] = useState<DockingArtifacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadArtifacts() {
      try {
        setLoading(true);
        setError("");

        const data = await getDockingArtifacts(interactionId);
        setArtifacts(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load docking results."
        );
      } finally {
        setLoading(false);
      }
    }

    loadArtifacts();
  }, [interactionId]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading docking results...
        </div>
      </section>
    );
  }

  if (error || !artifacts) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Docking Results
        </h2>

        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {error || "Docking result metadata is unavailable."}
        </p>
      </section>
    );
  }

  const bestPose = artifacts.poses[0];

  return (
    <section className="space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--color-text)]">
          <Activity className="h-5 w-5 text-[var(--color-primary)]" />
          Detailed Docking Results
        </h2>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Computational docking results generated using AutoDock Vina.
        </p>
      </div>

      {/* Summary Cards */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Trophy className="h-4 w-4" />
            Best Pose
          </div>

          <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            Pose {bestPose?.pose ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Target className="h-4 w-4" />
            Best Affinity
          </div>

          <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            {artifacts.best_affinity_kcal_per_mol.toFixed(3)}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            kcal/mol
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Atom className="h-4 w-4" />
            Receptor
          </div>

          <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            {artifacts.receptor_pdb_id}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            PDB structure
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <ChevronDown className="h-4 w-4" />
            Total Poses
          </div>

          <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            {artifacts.pose_count}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            PubChem CID {artifacts.pubchem_cid}
          </p>
        </div>

      </div>

      {/* Pose Table */}

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">

        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3">
          <h3 className="font-semibold text-[var(--color-text)]">
            Pose Analysis
          </h3>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            AutoDock Vina generated {artifacts.pose_count} predicted binding poses.
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface-soft)] text-left">

              <tr>
                <th className="px-4 py-3 font-semibold">Pose</th>
                <th className="px-4 py-3 font-semibold">
                  Affinity (kcal/mol)
                </th>
                <th className="px-4 py-3 font-semibold">
                  RMSD Lower
                </th>
                <th className="px-4 py-3 font-semibold">
                  RMSD Upper
                </th>
                <th className="px-4 py-3 font-semibold">
                  Atoms
                </th>
              </tr>

            </thead>

            <tbody>

              {artifacts.poses.map((pose) => {

                const isBestPose =
                  pose.pose === bestPose?.pose;

                return (

                  <tr
                    key={pose.pose}
                    className={
                      isBestPose
                        ? "border-b border-[var(--color-border)] bg-[var(--color-primary)]/5"
                        : "border-b border-[var(--color-border)] last:border-b-0"
                    }
                  >

                    <td className="px-4 py-3 font-semibold text-[var(--color-text)]">

                      <div className="flex items-center gap-2">

                        {isBestPose && (
                          <Trophy className="h-4 w-4 text-[var(--color-primary)]" />
                        )}

                        {pose.pose}

                      </div>

                    </td>

                    <td className="px-4 py-3 font-data">

                      {pose.affinity_kcal_per_mol.toFixed(3)}

                    </td>

                    <td className="px-4 py-3 font-data">

                      {pose.rmsd_lower_bound.toFixed(3)}

                    </td>

                    <td className="px-4 py-3 font-data">

                      {pose.rmsd_upper_bound.toFixed(3)}

                    </td>

                    <td className="px-4 py-3">

                      {pose.atom_count}

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>

      {/* Scientific Note */}

      <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">

        <p className="text-sm font-medium text-[var(--color-text)]">
          Computational interpretation
        </p>

        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Lower predicted binding affinity values generally indicate
          stronger predicted binding in AutoDock Vina. These results are
          computational predictions and should be interpreted together with
          structural analysis and experimental validation.
        </p>

      </div>

    </section>
  );
}
