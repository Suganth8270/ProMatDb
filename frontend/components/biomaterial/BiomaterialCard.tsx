import type { Biomaterial } from "@/types/biomaterial";
import {
  Leaf,
  Package,
  FlaskConical,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface BiomaterialCardProps {
  biomaterial: Biomaterial;
}

export default function BiomaterialCard({
  biomaterial,
}: BiomaterialCardProps) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

      {/* Top Gradient */}
      <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="p-6">

        {/* Header */}
        <div className="flex items-start justify-between">

          <div className="flex gap-4">

            <div className="h-20 w-20 overflow-hidden rounded-2xl border bg-white shadow-sm">

  {biomaterial.image_url ? (
    <img
      src={biomaterial.image_url}
      alt={biomaterial.name}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-emerald-100">
      <Leaf className="h-8 w-8 text-emerald-700" />
    </div>
  )}

</div>

            <div>

              <h2 className="text-2xl font-bold text-slate-900">
                {biomaterial.name}
              </h2>

              <p className="mt-1 text-slate-500">
                {biomaterial.category}
              </p>

            </div>

          </div>

          <span className="rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
            Biomaterial
          </span>

        </div>

        {/* Divider */}
        <div className="my-6 border-t border-slate-100" />

        {/* Source */}
        <div className="rounded-2xl bg-slate-50 p-4">

          <div className="flex items-center gap-2">

            <Package className="h-5 w-5 text-cyan-600" />

            <span className="font-semibold text-slate-900">
              Source
            </span>

          </div>

          <p className="mt-2 text-slate-600">
            {biomaterial.source}
          </p>

        </div>

        {/* Applications */}
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">

          <div className="flex items-center gap-2">

            <FlaskConical className="h-5 w-5 text-teal-600" />

            <span className="font-semibold text-slate-900">
              Applications
            </span>

          </div>

          <p className="mt-2 line-clamp-3 text-slate-600">
            {biomaterial.applications}
          </p>

        </div>

        {/* Status */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3">

          <ShieldCheck className="h-5 w-5 text-emerald-600" />

          <span className="text-sm font-medium text-emerald-700">
            Biocompatibility Information Available
          </span>

        </div>

        {/* Button */}
        <Link
          href={`/biomaterials/${biomaterial.id}`}
          className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
        >
          Explore Biomaterial
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>

      </div>

    </div>
  );
}