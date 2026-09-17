"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
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

interface PdbData {
  pdb_id: string;
  title?: string;
  experimental_method?: string;
  resolution?: string | number | string[];
  deposition_date?: string;
}

export default function ImportProteinPage() {
  const router = useRouter();

  const [uniprotId, setUniprotId] = useState("");
  const [protein, setProtein] = useState<UniProtProtein | null>(null);
  const [pdbId, setPdbId] = useState("");
  const [pdbData, setPdbData] = useState<PdbData | null>(null);
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
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Import Protein
          <button
            onClick={handleLinkPDB}
            className="ml-3 mt-6 rounded-xl bg-[var(--color-emerald)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-emerald)]/90"
          >
            Link PDB to Protein
          </button>
        </h1>

        <p className="mt-2 text-[var(--color-text-secondary)]">
          Import proteins directly from UniProt.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-[var(--color-text-secondary)]">
          UniProt ID
        </label>

        <input
          value={uniprotId}
          onChange={(e) => setUniprotId(e.target.value)}
          placeholder="Example: P02768"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />

        <button
          onClick={handleFetch}
          disabled={loading}
          className="mt-5 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch Protein"}
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-[var(--color-text-secondary)]">
          PDB ID
        </label>

        <input
          value={pdbId}
          onChange={(e) => setPdbId(e.target.value)}
          placeholder="Example: 1AO6"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />

        <button
          onClick={handlePDBFetch}
          className="mt-5 rounded-xl bg-[var(--color-indigo)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-indigo)]/90"
        >
          Fetch PDB
        </button>
      </div>

      {pdbData && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold text-[var(--color-text)]">
            PDB Preview
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                PDB ID
              </p>
              <p className="text-[var(--color-text)]">
                {pdbData.pdb_id}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Title
              </p>
              <p className="text-[var(--color-text)]">
                {pdbData.title || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Experimental Method
              </p>
              <p className="text-[var(--color-text)]">
                {pdbData.experimental_method || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Resolution
              </p>
              <p className="text-[var(--color-text)]">
                {Array.isArray(pdbData.resolution)
                  ? pdbData.resolution.join(", ")
                  : pdbData.resolution || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Deposition Date
              </p>
              <p className="text-[var(--color-text)]">
                {pdbData.deposition_date || "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}

      {protein && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold text-[var(--color-text)]">
            Protein Preview
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Protein Name
              </p>
              <p className="text-[var(--color-text)]">
                {protein.protein_name}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                UniProt ID
              </p>
              <p className="text-[var(--color-text)]">
                {protein.uniprot_id}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Organism
              </p>
              <p className="text-[var(--color-text)]">
                {protein.organism}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Sequence Length
              </p>
              <p className="text-[var(--color-text)]">
                {protein.sequence_length}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Molecular Weight
              </p>
              <p className="text-[var(--color-text)]">
                {protein.molecular_weight}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">
              Function
            </p>

            <p className="rounded-lg bg-[var(--color-surface-soft)] p-4 text-[var(--color-text)]">
              {protein.function || "No function available."}
            </p>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">
              Sequence
            </p>

            <div className="max-h-48 overflow-y-auto rounded-lg bg-[var(--color-surface-soft)] p-4 font-mono text-sm break-all text-[var(--color-text)]">
              {protein.sequence}
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-6 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Protein"}
          </button>
        </div>
      )}
    </div>
  );
}