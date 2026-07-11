"use client";
import { useMemo, useState } from "react";
import SearchBar from "@/components/common/SearchBar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProteinCard from "@/components/protein/ProteinCard";
import { useFetch } from "@/hooks/useFetch";
import { getProteins } from "@/services/api";
import { Protein } from "@/types/protein";

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
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Protein Explorer
          </h1>

          <p className="mt-2 text-slate-500">
            Browse proteins stored in the ProMatDB database.
            </p>

            <div className="my-8">
              <SearchBar
                 value={search}
                 onChange={setSearch}
    placeholder="Search by Protein Name, UniProt ID, PDB ID or Organism..."
  />
</div>
          
        </div>

        {loading && (
          <p className="text-slate-500">
            Loading proteins...
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {!loading && proteins && (
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
    </DashboardLayout>
  );
}