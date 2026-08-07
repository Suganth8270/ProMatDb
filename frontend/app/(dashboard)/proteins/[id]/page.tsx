// ============================================================================
// ProMatDB - Protein Details Page (Professional Redesign)
// File: frontend/app/(dashboard)/proteins/[id]/page.tsx
// ============================================================================

"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MolViewer from "@/components/protein/MolViewer";
import {
  ArrowLeft,
  Dna,
  ExternalLink,
  Database,
  Download,
  AlertTriangle,
  SearchX,
} from "lucide-react";

import { useFetch } from "@/hooks/useFetch";
import { getProtein } from "@/services/api";
import { Protein } from "@/types/protein";

function BackLink() {
  return (
    <Link
      href="/proteins"
      className="inline-flex items-center gap-2 font-semibold text-gray-700 transition-colors hover:text-teal-700"
    >
      <ArrowLeft size={18} /> Back to Proteins
    </Link>
  );
}

export default function ProteinDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const fetchProtein = useCallback(() => getProtein(id), [id]);
  const { data: protein, loading, error } = useFetch<Protein>(fetchProtein);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 animate-pulse rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5">
                <div className="h-[72px] w-[72px] rounded-2xl bg-slate-100" />
                <div className="space-y-3">
                  <div className="h-9 w-64 rounded bg-slate-100" />
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="flex gap-3">
                    <div className="h-8 w-28 rounded-full bg-slate-100" />
                    <div className="h-8 w-28 rounded-full bg-slate-100" />
                    <div className="h-8 w-24 rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
            <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
            <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Couldn&apos;t load this protein</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!protein) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <SearchX className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-lg font-semibold text-slate-900">
              Protein not found
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              We couldn&apos;t find a protein with this ID. It may have been
              removed or the link may be incorrect.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function downloadFasta() {
    const fasta = `>${protein!.protein_name}\n${protein!.sequence}`;
    const blob = new Blob([fasta], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${protein!.uniprot_id}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">

        <BackLink />

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-5">
              <div className="rounded-2xl bg-teal-100 p-4">
                <Dna className="h-10 w-10 text-teal-700"/>
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-3xl font-bold tracking-tight text-black md:text-4xl">
                  {protein.protein_name}
                </h1>

                <p className="mt-2 text-base text-gray-600">
                  Protein &middot; {protein.organism}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                    UniProt: {protein.uniprot_id}
                  </span>

                  <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-800">
                    PDB: {protein.pdb_id || "Not Linked"}
                  </span>

                  <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-gray-900">
                    {protein.molecular_weight.toLocaleString()} Da
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 md:shrink-0">
              <a href={`https://www.uniprot.org/uniprotkb/${protein.uniprot_id}`} target="_blank"
                 className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-teal-800">
                <ExternalLink size={18}/> UniProt
              </a>

              {protein.pdb_id && (
                <a href={`https://www.rcsb.org/structure/${protein.pdb_id}`} target="_blank"
                   className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700">
                  <Database size={18}/> PDB
                </a>
              )}

              <button onClick={downloadFasta}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-800">
                <Download size={18}/> FASTA
              </button>
            </div>

          </div>
        </div>

        <div className="mt-8 space-y-6">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-black">General Information</h2>
            <div className="grid gap-x-6 gap-y-4 text-gray-800 md:grid-cols-2">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 md:border-none md:pb-0">
                <span className="font-semibold text-slate-500">UniProt</span>
                <span className="text-right">{protein.uniprot_id}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 md:border-none md:pb-0">
                <span className="font-semibold text-slate-500">PDB</span>
                <span className="text-right">{protein.pdb_id || "Not Linked"}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 md:border-none md:pb-0">
                <span className="font-semibold text-slate-500">Organism</span>
                <span className="text-right">{protein.organism}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">Molecular Weight</span>
                <span className="text-right">{protein.molecular_weight.toLocaleString()} Da</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-black">Biological Function</h2>
            <p className="leading-7 text-gray-700">{protein.function}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-black">Amino Acid Sequence</h2>
              <span className="text-xs font-medium text-slate-400">
                {protein.sequence.length.toLocaleString()} residues
              </span>
            </div>
            <div className="max-h-80 overflow-auto rounded-xl bg-slate-100 p-4">
              <pre className="whitespace-pre-wrap break-all font-mono text-sm leading-6 text-gray-900">
                {protein.sequence}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-black">3D Structure</h2>
            <MolViewer
              pdbId={protein.pdb_id}
              height={650}
            />
          </section>

        </div>

      </div>
    </div>
  );
}