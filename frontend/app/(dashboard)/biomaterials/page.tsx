"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchX, AlertTriangle, PlusCircle } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import BiomaterialCard from "@/components/biomaterial/BiomaterialCard";
import Button from "@/components/common/Button";
import { useFetch } from "@/hooks/useFetch";
import { getBiomaterials } from "@/services/api";
import { Biomaterial } from "@/types/biomaterial";

function BiomaterialCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-slate-200" />
          <div className="min-w-0 space-y-2">
            <div className="h-5 w-36 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-100" />
      </div>

      <div className="space-y-3">
        <div className="h-11 rounded-xl bg-slate-50" />
        <div className="h-11 rounded-xl bg-slate-50" />
        <div className="h-11 rounded-xl bg-slate-50" />
      </div>

      <div className="mt-6 h-24 rounded-2xl bg-slate-50" />
      <div className="mt-6 h-11 rounded-xl bg-slate-100" />
    </div>
  );
}

export default function BiomaterialsPage() {
  const {
    data: biomaterials,
    loading,
    error,
  } = useFetch<Biomaterial[]>(getBiomaterials);
  const [search, setSearch] = useState("");

  const filteredBiomaterials = useMemo(() => {
    if (!biomaterials) return [];

    return biomaterials.filter((biomaterial) => {
      const query = search.toLowerCase();

      return (
        biomaterial.name.toLowerCase().includes(query) ||
        biomaterial.chemical_type.toLowerCase().includes(query) ||
        biomaterial.category.toLowerCase().includes(query) ||
        biomaterial.source.toLowerCase().includes(query)
      );
    });
  }, [biomaterials, search]);

  return (

     <div className="w-full">
          <div className="mb-8">

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Biomaterial Explorer
              </h1>

              <p className="mt-2 text-slate-500">
                Browse biomaterials stored in the ProMatDB database.
                </p>
            </div>

            <Link href="/biomaterials/import" className="shrink-0">
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Import Biomaterial
              </Button>
            </Link>
          </div>

            <div className="mt-6 mb-2 max-w-xl">
              <SearchBar
                 value={search}
                 onChange={setSearch}
    placeholder="Search by Biomaterial Name, Chemical Type, Category or Source..."
  />
</div>

          {!loading && !error && biomaterials && (
            <p className="mt-3 text-sm text-slate-400">
              Showing {filteredBiomaterials.length} of {biomaterials.length}{" "}
              {biomaterials.length === 1 ? "biomaterial" : "biomaterials"}
              {search && ` matching "${search}"`}
            </p>
          )}

        </div>

        {loading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <BiomaterialCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Couldn&apos;t load biomaterials</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && biomaterials && filteredBiomaterials.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <SearchX className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-900">
              No biomaterials found
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? `No biomaterials match "${search}". Try a different name, chemical type, category, or source.`
                : "There are no biomaterials in the database yet."}
            </p>
          </div>
        )}

        {!loading && !error && biomaterials && filteredBiomaterials.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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