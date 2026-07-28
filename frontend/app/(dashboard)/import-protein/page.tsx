"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";import {
  fetchUniProt,
  importUniProt,
  fetchPDB,
  linkPDB,
} from "@/services/api";


interface UniProtProtein {
  uniprot_id: string;
  protein_name: string;
  organism: string;
  sequence: string;
  sequence_length: number;
  molecular_weight: number;
  function: string;
}

export default function ImportProteinPage() {
  const router = useRouter();
  const [uniprotId, setUniprotId] = useState("");
  const [protein, setProtein] = useState<UniProtProtein | null>(null);
  const [pdbId, setPdbId] = useState("");
  const [pdbData, setPdbData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFetch = async () => {
    if (!uniprotId.trim()) {
      alert("Please enter a UniProt ID.");
      return;
    }

    try {
      setLoading(true);
      const data = await fetchUniProt(uniprotId.trim().toUpperCase());
      setProtein(data);
    } catch (error) {
      console.error(error);
      alert("Protein not found.");
      setProtein(null);
    } finally {
      setLoading(false);
    }
  };
  const handlePDBFetch = async () => {
  if (!pdbId.trim()) return;

  try {
    const data = await fetchPDB(pdbId.trim().toUpperCase());
    setPdbData(data);
  } catch (error) {
    console.error(error);
    alert("PDB entry not found.");
    setPdbData(null);
  }
};

const handleImport = async () => {
  if (!protein) return;

  try {
    setImporting(true);

    const response = await importUniProt(protein.uniprot_id);

    if (response.created) {
      alert("Protein imported successfully.");
    } else {
      const view = confirm(
        "Protein already exists.\n\nOpen the protein page?"
      );

      if (view) {
        router.push(`/proteins/${response.protein_id}`);
      }
    }
  } catch (error) {
    console.error(error);
    alert("Import failed.");
  } finally {
    setImporting(false);
  }
};

  const handleLinkPDB = async () => {
  if (!protein || !pdbData) {
    alert("Fetch both UniProt and PDB first.");
    return;
  }

  try {
    const response = await linkPDB(
      protein.uniprot_id,
      pdbData.pdb_id
    );

    alert(response.message);
  } catch (error) {
    console.error(error);
    alert("Failed to link PDB.");
  }
};

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Import Protein
          <button
  onClick={handleLinkPDB}
  className="ml-3 mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
>
  Link PDB to Protein
</button>
        </h1>

        <p className="mt-2 text-slate-600">
          Import proteins directly from UniProt.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <label className="mb-2 block text-sm font-semibold text-slate-700">
          UniProt ID
        </label>

        <input
          value={uniprotId}
          onChange={(e) => setUniprotId(e.target.value)}
          placeholder="Example: P02768"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
        />

        <button
          onClick={handleFetch}
          disabled={loading}
          className="mt-5 rounded-xl bg-[#0F766E] px-6 py-3 font-semibold text-white transition hover:bg-[#0d665f] disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch Protein"}
        </button>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

  <label className="mb-2 block text-sm font-semibold text-slate-700">
    PDB ID
  </label>

  <input
    value={pdbId}
    onChange={(e) => setPdbId(e.target.value)}
    placeholder="Example: 1AO6"
    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
  />

  <button
    onClick={handlePDBFetch}
    className="mt-5 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
  >
    Fetch PDB
  </button>

</div>

{pdbData && (
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-5 text-2xl font-bold text-slate-900">
      PDB Preview
    </h2>

    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <p className="text-sm font-semibold text-slate-500">PDB ID</p>
        <p className="text-slate-900">{pdbData.pdb_id}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-500">Title</p>
        <p className="text-slate-900">{pdbData.title}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-500">
          Experimental Method
        </p>
        <p className="text-slate-900">
          {pdbData.experimental_method || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-500">
          Resolution
        </p>
        <p className="text-slate-900">
          {Array.isArray(pdbData.resolution)
            ? pdbData.resolution.join(", ")
            : pdbData.resolution || "N/A"}
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-500">
          Deposition Date
        </p>
        <p className="text-slate-900">
          {pdbData.deposition_date}
        </p>
      </div>
    </div>
  </div>
)}

      {protein && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-2xl font-bold text-slate-900">
            Protein Preview
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Protein Name
              </p>
              <p className="text-slate-900">
                {protein.protein_name}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                UniProt ID
              </p>
              <p className="text-slate-900">
                {protein.uniprot_id}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Organism
              </p>
              <p className="text-slate-900">
                {protein.organism}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Sequence Length
              </p>
              <p className="text-slate-900">
                {protein.sequence_length}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Molecular Weight
              </p>
              <p className="text-slate-900">
                {protein.molecular_weight}
              </p>
            </div>

          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-slate-500">
              Function
            </p>

            <p className="rounded-lg bg-slate-50 p-4 text-slate-800">
              {protein.function || "No function available."}
            </p>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-slate-500">
              Sequence
            </p>

            <div className="max-h-48 overflow-y-auto rounded-lg bg-slate-50 p-4 font-mono text-sm break-all text-slate-800">
              {protein.sequence}
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Protein"}
          </button>

        </div>
      )}

    </div>
  );
}