"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useFetch } from "@/hooks/useFetch";
import { getBiomaterials } from "@/services/api";
import type { Biomaterial } from "@/types/biomaterial";
import BiomaterialCard from "@/components/biomaterial/BiomaterialCard";

export default function BiomaterialsPage() {
  const {
    data: biomaterials,
    loading,
    error,
  } = useFetch<Biomaterial[]>(getBiomaterials);

  const [search, setSearch] = useState("");

  const filteredBiomaterials = useMemo(() => {
    if (!biomaterials) return [];

    return biomaterials.filter((item) => {
      const value = search.toLowerCase();

      return (
        item.name.toLowerCase().includes(value) ||
        item.description.toLowerCase().includes(value)
      );
    });
  }, [biomaterials, search]);

  return (
    <div className="space-y-8">

      {/* Header */}

      <section className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-xl">

        <h1 className="text-4xl font-bold">
          Biomaterial Explorer
        </h1>

        <p className="mt-3 max-w-2xl text-emerald-100">
          Discover biomaterials used in tissue engineering,
          regenerative medicine, drug delivery, implants,
          biosensors and biomedical research.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-emerald-100">
              Total Biomaterials
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {biomaterials?.length ?? 0}
            </h2>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-emerald-100">
              Natural
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              —
            </h2>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-emerald-100">
              Synthetic
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              —
            </h2>
          </div>

        </div>

      </section>

      {/* Search */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="relative">

          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search biomaterials..."
            className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 outline-none transition focus:border-emerald-500"
          />

        </div>

      </section>

      {loading && (
        <div className="rounded-xl bg-white p-8 text-center shadow">
          Loading biomaterials...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">

          {filteredBiomaterials.map((biomaterial) => (

            <BiomaterialCard
              key={biomaterial.id}
              biomaterial={biomaterial}
            />

          ))}

        </div>

      )}

    </div>
  );
}