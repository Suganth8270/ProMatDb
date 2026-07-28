"use client";

import { useFetch } from "@/hooks/useFetch";
import { getInteractions } from "@/services/api";
import type { Interaction } from "@/types/interaction";
import InteractionCard from "@/components/interaction/InteractionCard";

export default function InteractionsPage() {
  const {
    data: interactions,
    loading,
    error,
  } = useFetch<Interaction[]>(getInteractions);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Interaction Explorer
        </h1>

        <p className="mt-2 text-slate-500">
          Browse protein–biomaterial interactions stored in the ProMatDB database.
        </p>
      </div>

      {loading && (
        <p className="text-slate-500">
          Loading interactions...
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {!loading && interactions && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {interactions.map((interaction) => (
            <InteractionCard
              key={interaction.id}
              interaction={interaction}
            />
          ))}
        </div>
      )}
    </div>
  );
}