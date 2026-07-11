import { Dna, Database, Weight, FlaskConical, ArrowRight } from "lucide-react";
import { Protein } from "@/types/protein";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";

interface ProteinCardProps {
  protein: Protein;
}

export default function ProteinCard({ protein }: ProteinCardProps) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex gap-4">
          <div className="rounded-2xl bg-teal-100 p-3">
            <Dna className="h-7 w-7 text-[#0F766E]" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {protein.protein_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {protein.organism}
            </p>
          </div>
        </div>

        <Badge color="cyan">Protein</Badge>
      </div>

      {/* Information */}
      <div className="space-y-4">

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-600" />
            <span className="font-semibold text-slate-700">
              UniProt
            </span>
          </div>

          <Badge color="teal">
            {protein.uniprot_id}
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">
              PDB
            </span>
          </div>

          <Badge color="indigo">
            {protein.pdb_id}
          </Badge>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-teal-600" />
            <span className="font-semibold text-slate-700">
              Weight
            </span>
          </div>

          <span className="font-semibold text-slate-900">
            {protein.molecular_weight.toLocaleString()} Da
          </span>
        </div>

      </div>

      {/* Function */}
      <div className="mt-6 rounded-2xl bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-cyan-600" />
          <h3 className="font-semibold text-slate-900">
            Function
          </h3>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          {protein.function}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full"
        >
          View Details
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

    </div>
  );
}