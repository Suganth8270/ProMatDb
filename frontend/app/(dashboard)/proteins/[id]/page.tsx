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
} from "lucide-react";

import { useFetch } from "@/hooks/useFetch";
import { getProtein } from "@/services/api";
import { Protein } from "@/types/protein";

export default function ProteinDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const fetchProtein = useCallback(() => getProtein(id), [id]);
  const { data: protein, loading, error } = useFetch<Protein>(fetchProtein);

  if (loading) return <div className="p-8 text-black">Loading protein...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!protein) 
    {return <div className="p-8 text-black">Protein not found.</div>;
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

        <Link href="/proteins" className="inline-flex items-center gap-2 text-gray-700 hover:text-teal-700 font-semibold">
          <ArrowLeft size={18}/> Back to Proteins
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div className="flex items-start gap-5">
              <div className="rounded-2xl bg-teal-100 p-4">
                <Dna className="h-10 w-10 text-teal-700"/>
              </div>

              <div>
                <h1 className="text-5xl font-bold text-black">
                  {protein.protein_name}
                </h1>

                <p className="mt-2 text-lg text-gray-700">
                  Protein • {protein.organism}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                    UniProt : {protein.uniprot_id}
                  </span>

                  <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-800">
                    PDB : {protein.pdb_id || "Not Linked"}
                  </span>

                  <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-gray-900">
                    {protein.molecular_weight.toLocaleString()} Da
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href={`https://www.uniprot.org/uniprotkb/${protein.uniprot_id}`} target="_blank"
                 className="rounded-xl bg-teal-700 px-5 py-3 text-white font-semibold inline-flex items-center gap-2">
                <ExternalLink size={18}/> UniProt
              </a>

              {protein.pdb_id && (
                <a href={`https://www.rcsb.org/structure/${protein.pdb_id}`} target="_blank"
                   className="rounded-xl bg-indigo-600 px-5 py-3 text-white font-semibold inline-flex items-center gap-2">
                  <Database size={18}/> PDB
                </a>
              )}

              <button onClick={downloadFasta}
                className="rounded-xl bg-slate-900 px-5 py-3 text-white font-semibold inline-flex items-center gap-2">
                <Download size={18}/> FASTA
              </button>
            </div>

          </div>
        </div>

        <div className="mt-8 space-y-6">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-black mb-5">General Information</h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-800">
              <div><b>UniProt:</b> {protein.uniprot_id}</div>
              <div><b>PDB:</b> {protein.pdb_id || "Not Linked"}</div>
              <div><b>Organism:</b> {protein.organism}</div>
              <div><b>Molecular Weight:</b> {protein.molecular_weight} Da</div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-black mb-5">Biological Function</h2>
            <p className="leading-8 text-gray-800">{protein.function}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-black mb-5">Amino Acid Sequence</h2>
            <div className="rounded-xl bg-slate-100 p-4 max-h-80 overflow-auto">
              <pre className="font-mono text-sm whitespace-pre-wrap break-all text-gray-900">
                {protein.sequence}
              </pre>
            </div>
          </section>

          <MolViewer
  pdbId={protein.pdb_id}
  height={650}
/>

        </div>

      </div>
    </div>
  );
}
