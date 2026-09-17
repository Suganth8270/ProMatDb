import { Database, Weight, FlaskConical, ArrowRight, Leaf } from "lucide-react";
import { Biomaterial } from "@/types/biomaterial";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import Link from "next/link";
import { Card3D, Card3DLayer } from "@/components/ui/3d-card";

interface BiomaterialCardProps {
  biomaterial: Biomaterial;
}

function entityTypeLabel(entityType: Biomaterial["entity_type"]): string {
  if (entityType === "biomaterial") return "Biomaterial";
  if (entityType === "drug") return "Drug";
  if (entityType === "small_molecule") return "Small Molecule";
  return "Unclassified";
}

export default function BiomaterialCard({ biomaterial }: BiomaterialCardProps) {
  return (
    <Link href={`/biomaterials/${biomaterial.id}`} className="block h-full">
      <Card3D glow="primary" className="group h-full">
        <div className="flex h-full flex-col p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-4">
              <Card3DLayer depth={36} className="shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 transition-colors duration-300 group-hover:bg-teal-600 dark:bg-teal-500/10 dark:group-hover:bg-teal-500/25">
                  <Leaf className="h-6 w-6 text-[var(--color-primary)] transition-colors duration-300 group-hover:text-white" />
                </div>
              </Card3DLayer>

              <div className="min-w-0 pt-0.5">
                <h2
                  className="truncate text-xl font-bold text-[var(--color-text)]"
                  title={biomaterial.name}
                >
                  {biomaterial.name}
                </h2>

                <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">
                  {biomaterial.source}
                </p>
              </div>
            </div>

            <Card3DLayer depth={44}>
              <Badge color="cyan">{entityTypeLabel(biomaterial.entity_type)}</Badge>
            </Card3DLayer>
          </div>

          {/* Information */}
          <Card3DLayer depth={14} className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-soft)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[var(--color-secondary)]" />
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  Chemical Type
                </span>
              </div>

              {biomaterial.chemical_type ? (
                <Badge color="teal">
                  <span className="font-data">{biomaterial.chemical_type}</span>
                </Badge>
              ) : (
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Not specified
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-soft)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[var(--color-indigo)]" />
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  Category
                </span>
              </div>

              {biomaterial.category ? (
                <Badge color="indigo">
                  <span className="font-data">{biomaterial.category}</span>
                </Badge>
              ) : (
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Not specified
                </span>
              )}
            </div>

         <div className="flex items-start justify-between gap-3 rounded-xl bg-[var(--color-surface-soft)] px-4 py-3">
  <div className="flex shrink-0 items-center gap-2 pt-0.5">
    <Weight className="h-4 w-4 text-[var(--color-primary)]" />
    <span className="font-semibold text-[var(--color-text-secondary)]">
      Weight
    </span>
  </div>

  <span className="font-data min-w-0 flex-1 break-words text-right font-semibold text-[var(--color-text)]">
    {biomaterial.molecular_weight
      ? `${biomaterial.molecular_weight} g/mol`
      : "—"}
  </span>
</div>
          </Card3DLayer>

          {/* Applications */}
          <Card3DLayer depth={10} className="mt-6 flex-1">
            <div className="h-full rounded-2xl bg-[var(--color-surface-soft)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-[var(--color-secondary)]" />
                <h3 className="font-semibold text-[var(--color-text)]">
                  Applications
                </h3>
              </div>

              <p
                className="line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]"
                title={biomaterial.applications}
              >
                {biomaterial.applications}
              </p>
            </div>
          </Card3DLayer>

          {/* Footer */}
          <Card3DLayer depth={26} className="mt-6">
            <Button
              variant="outline"
              className="w-full transition-colors duration-300 group-hover:bg-teal-700 group-hover:text-white"
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Card3DLayer>
        </div>
      </Card3D>
    </Link>
  );
}