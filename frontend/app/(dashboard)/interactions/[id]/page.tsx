"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";

import { useFetch } from "@/hooks/useFetch";
import { getInteraction } from "@/services/api";
import type { Interaction } from "@/types/interaction";

export default function InteractionDetailsPage() {
  const params = useParams();
  const id = params.id;

  const fetchInteraction = useCallback(
    () => getInteraction(id as string),
    [id]
  );

  const {
    data: interaction,
    loading,
    error,
  } = useFetch<Interaction>(fetchInteraction);

  if (loading) {
    return (
      <div className="p-8 text-slate-600">
        Loading interaction...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600">
        {error}
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="rounded-xl bg-yellow-50 p-6 text-yellow-700">
        Interaction not found.
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Header */}

      <div className="mb-10">

        <h1 className="text-4xl font-bold text-slate-900">
          Protein–Biomaterial Interaction
        </h1>

        <p className="mt-2 text-lg text-slate-500">
          Detailed interaction information
        </p>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Protein */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

        <h2 className="mb-6 text-2xl font-semibold text-slate-900">
            Protein
          </h2>

          <div className="space-y-4">

            <p>
              <strong className="text-slate-900">Name:</strong>{" "}
              {interaction.protein.protein_name}
            </p>

            <p>
              <strong className="text-slate-900">UniProt:</strong>{" "}
              {interaction.protein.uniprot_id}
            </p>

          </div>

        </div>

        {/* Biomaterial */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

<h2 className="mb-6 text-2xl font-semibold text-slate-900">            Biomaterial
          </h2>

          <div className="space-y-4">

            <p>
             <strong className="text-slate-900">Name:</strong>{" "}
              {interaction.biomaterial.name}
            </p>

            <p>
              <strong className="text-slate-900">Category:</strong>{" "}
              {interaction.biomaterial.category}
            </p>

          </div>

        </div>

        {/* Interaction Data */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

          <h2 className="mb-6 text-2xl font-semibold text-slate-900">
            Docking Results
          </h2>

          <div className="space-y-4">

            <p>
              <strong className="text-slate-900">Binding Energy:</strong>{" "}
              {interaction.binding_energy}
            </p>

            <p>
              <strong className="text-slate-900">Docking Score:</strong>{" "}
              {interaction.docking_score}
            </p>

            <p>
              <strong className="text-slate-900">Interaction Type:</strong>{" "}
              {interaction.interaction_type}
            </p>

          </div>

        </div>

        {/* Reference */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

         <h2 className="mb-6 text-2xl font-semibold text-slate-900">
            Reference
          </h2>

          <p>
            {interaction.reference}
          </p>

        </div>

      </div>

    </div>
  );
}