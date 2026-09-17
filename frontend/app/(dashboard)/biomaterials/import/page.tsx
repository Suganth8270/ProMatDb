"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchPubChem, importPubChem } from "@/services/api";

interface Biomaterial {
  pubchem_cid: string;
  name: string;
  molecular_formula: string;
  molecular_weight: string;
}

export default function ImportBiomaterialPage() {
    const router = useRouter();
  const [cid, setCid] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [biomaterial, setBiomaterial] = useState<Biomaterial | null>(null);

  const handleFetch = async () => {
    if (!cid.trim()) {
      alert("Please enter a PubChem CID.");
      return;
    }

    try {
      setLoading(true);
      const data = await fetchPubChem(cid.trim());
      setBiomaterial(data);
    } catch (err) {
      console.error(err);
      alert("Biomaterial not found.");
      setBiomaterial(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
  if (!biomaterial) return;

  try {
    setImporting(true);

    const response = await importPubChem(
      biomaterial.pubchem_cid
    );

    if (response.biomaterial?.id) {
      router.push(`/biomaterials/${response.biomaterial.id}`);
      return;
    }

    alert(response.message);

  } catch (err) {
    console.error(err);
    alert("Import failed.");
  } finally {
    setImporting(false);
  }
};

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Import Biomaterial
        </h1>

        <p className="mt-2 text-[var(--color-text-secondary)]">
          Import biomaterials directly from PubChem.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">

        <label className="mb-2 block text-sm font-semibold text-[var(--color-text-secondary)]">
          PubChem CID
        </label>

        <input
          value={cid}
          onChange={(e) => setCid(e.target.value)}
          placeholder="Example: 2244"
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />

        <button
          onClick={handleFetch}
          disabled={loading}
          className="mt-5 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch Biomaterial"}
        </button>

      </div>

      {biomaterial && (

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">

          <h2 className="mb-5 text-2xl font-bold text-[var(--color-text)]">
            Biomaterial Preview
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Name
              </p>
            <p className="text-[var(--color-text)] font-medium">
  {biomaterial.name}
</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                PubChem CID
              </p>
              <p className="text-[var(--color-text)] font-medium">
  {biomaterial.pubchem_cid}
</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Molecular Formula
              </p>
           <p className="text-[var(--color-text)] font-medium">
  {biomaterial.molecular_weight}
</p>   
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Molecular Weight
              </p>
              <p className="text-[var(--color-text)] font-medium">
  {biomaterial.molecular_weight}
</p>
            </div>

          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-6 rounded-xl bg-[var(--color-primary)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Biomaterial"}
          </button>

        </div>

      )}

    </div>
  );
}