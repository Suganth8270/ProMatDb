import { Database, Weight, FlaskConical, ArrowRight, Leaf } from "lucide-react";
import { Biomaterial } from "@/types/biomaterial";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import Link from "next/link";


interface BiomaterialCardProps {
  biomaterial: Biomaterial;
}

export default function BiomaterialCard({ biomaterial }: BiomaterialCardProps) {
  return (
   <Link href={`/biomaterials/${biomaterial.id}`} className="block h-full">
    <div className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 transition-colors duration-300 group-hover:bg-teal-600">
            <Leaf className="h-6 w-6 text-[#0F766E] transition-colors duration-300 group-hover:text-white" />
          </div>

          <div className="min-w-0">
            <h2
              className="truncate text-xl font-bold text-slate-900"
              title={biomaterial.name}
            >
              {biomaterial.name}
            </h2>

            <p className="mt-1 truncate text-sm text-slate-500">
              {biomaterial.source}
            </p>
          </div>
        </div>

        <Badge color="cyan">Biomaterial</Badge>
      </div>

      {/* Information */}
      <div className="space-y-3">

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-600" />
            <span className="font-semibold text-slate-700">
              Chemical Type
            </span>
          </div>

          {biomaterial.chemical_type ? (
            <Badge color="teal">
              {biomaterial.chemical_type}
            </Badge>
          ) : (
            <span className="text-sm font-medium text-slate-400">
              Not specified
            </span>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">
              Category
            </span>
          </div>

          {biomaterial.category ? (
            <Badge color="indigo">{biomaterial.category}</Badge>
          ) : (
            <span className="text-sm font-medium text-slate-400">
              Not specified
            </span>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-teal-600" />
            <span className="font-semibold text-slate-700">
              Weight
            </span>
          </div>

          <span className="font-semibold text-slate-900">
            {biomaterial.molecular_weight
              ? `${biomaterial.molecular_weight} g/mol`
              : "—"}
          </span>
        </div>

      </div>

      {/* Applications */}
      <div className="mt-6 flex-1 rounded-2xl bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-cyan-600" />
          <h3 className="font-semibold text-slate-900">
            Applications
          </h3>
        </div>

        <p
          className="line-clamp-3 text-sm leading-6 text-slate-600"
          title={biomaterial.applications}
        >
          {biomaterial.applications}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full transition-colors duration-300 group-hover:bg-teal-700 group-hover:text-white"
        >
          View Details
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </div>

    </div>
    </Link>
  );
}