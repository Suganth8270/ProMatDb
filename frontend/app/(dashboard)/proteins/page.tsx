"use client";
import { useMemo, useState } from "react";
import { SearchX, AlertTriangle } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import ProteinCard from "@/components/protein/ProteinCard";
import { useFetch } from "@/hooks/useFetch";
import { getProteins } from "@/services/api";
import { Protein } from "@/types/protein";

function ProteinCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-4">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--color-surface-soft)]" />
          <div className="min-w-0 space-y-2">
            <div className="h-5 w-36 rounded bg-[var(--color-surface-soft)]" />
            <div className="h-3 w-24 rounded bg-[var(--color-border-soft)]" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-[var(--color-border-soft)]" />
      </div>

      <div className="space-y-3">
        <div className="h-11 rounded-xl bg-[var(--color-surface-soft)]" />
        <div className="h-11 rounded-xl bg-[var(--color-surface-soft)]" />
        <div className="h-11 rounded-xl bg-[var(--color-surface-soft)]" />
      </div>

      <div className="mt-6 h-24 rounded-2xl bg-[var(--color-surface-soft)]" />
      <div className="mt-6 h-11 rounded-xl bg-[var(--color-border-soft)]" />
    </div>
  );
}

export default function ProteinsPage() {
  const {
    data: proteins,
    loading,
    error,
  } = useFetch<Protein[]>(getProteins);
  const [search, setSearch] = useState("");

const filteredProteins = useMemo(() => {
  if (!proteins) return [];

  return proteins.filter((protein) => {
    const query = search.toLowerCase();

    return (
      protein.protein_name.toLowerCase().includes(query) ||
      protein.uniprot_id.toLowerCase().includes(query) ||
      protein.pdb_id.toLowerCase().includes(query) ||
      protein.organism.toLowerCase().includes(query)
    );
  });
}, [proteins, search]);

  return (

     <div className="w-full">
          <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
            Protein Explorer
          </h1>

          <p className="mt-2 text-[var(--color-text-secondary)]">
            Browse proteins stored in the ProMatDB database.
            </p>

            <div className="mt-6 mb-2 max-w-xl">
              <SearchBar
                 value={search}
                 onChange={setSearch}
    placeholder="Search by Protein Name, UniProt ID, PDB ID or Organism..."
  />
</div>

          {!loading && !error && proteins && (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Showing {filteredProteins.length} of {proteins.length}{" "}
              {proteins.length === 1 ? "protein" : "proteins"}
              {search && ` matching "${search}"`}
            </p>
          )}

        </div>

        {loading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProteinCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-5 text-[var(--color-danger)]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" />
            <div>
              <p className="font-semibold">Couldn&apos;t load proteins</p>
              <p className="mt-1 text-sm text-[var(--color-danger)]">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && proteins && filteredProteins.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 px-6 py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-soft)]">
              <SearchX className="h-7 w-7 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--color-text)]">
              No proteins found
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">
              {search
                ? `No proteins match "${search}". Try a different name, UniProt ID, PDB ID, or organism.`
                : "There are no proteins in the database yet."}
            </p>
          </div>
        )}

        {!loading && !error && proteins && filteredProteins.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProteins.map((protein) => (
              <ProteinCard
                key={protein.id}
                protein={protein}
              />
            ))}
          </div>
        )}
      </div>

  );
}