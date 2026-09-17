import { Dna, Database, Weight, FlaskConical, ArrowRight } from "lucide-react";
import { Protein } from "@/types/protein";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import Link from "next/link";
import { Card3D, Card3DLayer } from "@/components/ui/3d-card";

interface ProteinCardProps {
  protein: Protein;
}

export default function ProteinCard({ protein }: ProteinCardProps) {
  return (
    <Link href={`/proteins/${protein.id}`} className="block h-full">
      <Card3D glow="primary" className="group h-full">
        <div className="flex h-full flex-col p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="flex min-w-0 gap-4">
              <Card3DLayer depth={36} className="shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 transition-colors duration-300 group-hover:bg-teal-600 dark:bg-teal-500/10 dark:group-hover:bg-teal-500/25">
                  <Dna className="h-6 w-6 text-[var(--color-primary)] transition-colors duration-300 group-hover:text-white" />
                </div>
              </Card3DLayer>

              <div className="min-w-0 pt-0.5">
                <h2
                  className="truncate text-xl font-bold text-[var(--color-text)]"
                  title={protein.protein_name}
                >
                  {protein.protein_name}
                </h2>

                <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">
                  {protein.organism}
                </p>
              </div>
            </div>

            <Card3DLayer depth={44}>
              <Badge color="cyan">Protein</Badge>
            </Card3DLayer>
          </div>

          {/* Information */}
          <Card3DLayer depth={14} className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-soft)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[var(--color-secondary)]" />
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  UniProt
                </span>
              </div>

              <Badge color="teal">
                <span className="font-data">{protein.uniprot_id}</span>
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-soft)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[var(--color-indigo)]" />
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  PDB
                </span>
              </div>

              {protein.pdb_id ? (
                <Badge color="indigo">
                  <span className="font-data">{protein.pdb_id}</span>
                </Badge>
              ) : (
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Not linked
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-soft)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="font-semibold text-[var(--color-text-secondary)]">
                  Weight
                </span>
              </div>

              <span className="font-data font-semibold text-[var(--color-text)]">
                {protein.molecular_weight.toLocaleString()} Da
              </span>
            </div>
          </Card3DLayer>

          {/* Function */}
          <Card3DLayer depth={10} className="mt-6 flex-1">
            <div className="h-full rounded-2xl bg-[var(--color-surface-soft)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-[var(--color-secondary)]" />
                <h3 className="font-semibold text-[var(--color-text)]">
                  Function
                </h3>
              </div>

              <p
                className="line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]"
                title={protein.function}
              >
                {protein.function}
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