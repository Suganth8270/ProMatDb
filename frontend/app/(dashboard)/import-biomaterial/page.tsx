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
        <h1 className="text-3xl font-bold text-slate-900">
          Import Biomaterial
        </h1>

        <p className="mt-2 text-slate-600">
          Import biomaterials directly from PubChem.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <label className="mb-2 block text-sm font-semibold text-slate-700">
          PubChem CID
        </label>

        <input
          value={cid}
          onChange={(e) => setCid(e.target.value)}
          placeholder="Example: 2244"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
        />

        <button
          onClick={handleFetch}
          disabled={loading}
          className="mt-5 rounded-xl bg-[#0F766E] px-6 py-3 font-semibold text-white transition hover:bg-[#0d665f] disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch Biomaterial"}
        </button>

      </div>

      {biomaterial && (

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-2xl font-bold text-slate-900">
            Biomaterial Preview
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Name
              </p>
            <p className="text-slate-900 font-medium">
  {biomaterial.name}
</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                PubChem CID
              </p>
              <p className="text-slate-900 font-medium">
  {biomaterial.pubchem_cid}
</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Molecular Formula
              </p>
           <p className="text-slate-900 font-medium">
  {biomaterial.molecular_weight}
</p>   
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Molecular Weight
              </p>
              <p className="text-slate-900 font-medium">
  {biomaterial.molecular_weight}
</p>
            </div>

          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import Biomaterial"}
          </button>

        </div>

      )}

    </div>
  );
}