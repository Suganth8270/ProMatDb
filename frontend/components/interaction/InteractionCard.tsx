import type { Interaction } from "@/types/interaction";
import { Dna, Leaf, Zap, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card3D, Card3DLayer } from "@/components/ui/3d-card";

interface InteractionCardProps {
  interaction: Interaction;
}

function entityTypeLabel(entityType: Interaction["biomaterial"]["entity_type"]): string {
  if (entityType === "biomaterial") return "Biomaterial";
  if (entityType === "drug") return "Drug";
  if (entityType === "small_molecule") return "Small Molecule";
  return "Unclassified";
}

export default function InteractionCard({
  interaction,
}: InteractionCardProps) {
  const isVinaResult = interaction.interaction_type === "AutoDock Vina";
  const dockingLabel = isVinaResult ? "Vina Affinity" : "Docking Score";
  const dockingValue = isVinaResult
    ? `${interaction.docking_score} kcal/mol`
    : interaction.docking_score;
  return (
    <Card3D glow="indigo" className="group h-full">
      <div className="flex h-full flex-col p-6">
        {/* Header */}
        <Card3DLayer depth={36} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-3 dark:bg-indigo-500/10">
              <Dna className="h-6 w-6 text-[var(--color-indigo)]" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-[var(--color-text)]">
                <span className="font-medium">
                  {interaction.protein.protein_name}
                </span>
              </h2>

              <p className="truncate text-[var(--color-text-muted)]">
                <span className="font-data font-medium">
                  {interaction.protein.uniprot_id}
                </span>
              </p>
            </div>
          </div>
        </Card3DLayer>

        {/* Biomaterial */}
        <Card3DLayer depth={14} className="mb-4">
          <div className="rounded-2xl bg-[var(--color-surface-soft)] p-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[var(--color-emerald)]" />
              <span className="font-semibold text-[var(--color-text)]">
                {entityTypeLabel(interaction.biomaterial.entity_type)}
              </span>
            </div>

            <p className="mt-2 text-[var(--color-text-secondary)]">
              <span className="font-medium text-[var(--color-text)]">
                {interaction.biomaterial.name}
              </span>
            </p>
          </div>
        </Card3DLayer>

        {/* Scores */}
        <Card3DLayer depth={10} className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[var(--color-warning)]" />
                <span className="font-semibold text-[var(--color-text)]">
                  Binding Energy
                </span>
              </div>

              <p className="font-data mt-2 text-lg font-bold text-[var(--color-text)]">
                {interaction.binding_energy === null
                  ? "Not available"
                  : interaction.binding_energy}
              </p>
              {interaction.binding_energy === null && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  No experimental value recorded
                </p>
              )}
            </div>

            <div className="rounded-xl bg-[var(--color-surface-soft)] p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--color-violet)]" />
                <span className="font-semibold text-[var(--color-text)]">
                  {dockingLabel}
                </span>
              </div>

              <p className="font-data mt-2 text-lg font-bold text-[var(--color-text)]">
                {dockingValue}
              </p>
            </div>
          </div>
        </Card3DLayer>

        {/* Footer */}
        <Card3DLayer depth={26} className="mt-6">
          <Link
            href={`/interactions/${interaction.id}`}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[var(--color-indigo)] py-3 font-semibold text-[var(--color-indigo)] transition hover:bg-[var(--color-indigo)] hover:text-white"
          >
            View Details
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Card3DLayer>
      </div>
    </Card3D>
  );
}