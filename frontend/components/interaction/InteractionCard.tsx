import type { Interaction } from "@/types/interaction";
import {
  Dna,
  Leaf,
  Zap,
  Target,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface InteractionCardProps {
  interaction: Interaction;
}

export default function InteractionCard({
  interaction,
}: InteractionCardProps) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* Header */}
      <div className="mb-6">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-blue-100 p-3">
            <Dna className="h-6 w-6 text-blue-700" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
               <span className="text-slate-800 font-medium">
              {interaction.protein.protein_name}
              </span>
              
            </h2>

            <p className="text-slate-500">
<span className="text-slate-800 font-medium">
              {interaction.protein.uniprot_id}
               </span>
            </p>
          </div>

        </div>

      </div>

      {/* Biomaterial */}

      <div className="mb-4 rounded-2xl bg-slate-50 p-4">

        <div className="flex items-center gap-2">

          <Leaf className="h-5 w-5 text-emerald-600" />

          <span className="font-semibold text-slate-900">
            Biomaterial
          </span>

        </div>

        <p className="mt-2 text-slate-700">
          <span className="text-slate-800 font-medium">
          {interaction.biomaterial.name}
          </span>
        </p>

      </div>

      {/* Scores */}

      <div className="grid grid-cols-2 gap-4">

        <div className="rounded-xl bg-slate-50 p-4">

          <div className="flex items-center gap-2">

            <Zap className="h-5 w-5 text-yellow-500" />

            <span className="font-semibold text-slate-900">
              Binding
            </span>

          </div>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {interaction.binding_energy}
          </p>

        </div>

        <div className="rounded-xl bg-slate-50 p-4">

          <div className="flex items-center gap-2">

            <Target className="h-5 w-5 text-purple-600" />

            <span className="font-semibold text-slate-900">
              Docking
            </span>

          </div>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {interaction.docking_score}
          </p>

        </div>

      </div>

      <Link
        href={`/interactions/${interaction.id}`}
        className="mt-6 flex items-center justify-center gap-2 rounded-2xl border-2 border-blue-600 py-3 font-semibold text-blue-700 transition hover:bg-blue-600 hover:text-white"
      >
        View Details
        <ArrowRight className="h-5 w-5" />
      </Link>

    </div>
  );
}