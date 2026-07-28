"use client";

import { useState } from "react";
import { importFASTA } from "@/services/api";

export default function ImportFastaPage() {
  const [header, setHeader] = useState("");
  const [sequence, setSequence] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const text = await file.text();

    const lines = text.split("\n");

    const fastaHeader = lines[0].replace(">", "").trim();

    const fastaSequence = lines
      .slice(1)
      .join("")
      .replace(/\s/g, "");

    setHeader(fastaHeader);
    setSequence(fastaSequence);
  };

  const handleImport = async () => {
  if (!sequence) {
    alert("Please select a FASTA file.");
    return;
  }

  try {
    setImporting(true);

    const response = await importFASTA(
      header,
      sequence
    );

    alert(response.message);
  } catch (error) {
    console.error(error);
    alert("Failed to import FASTA.");
  } finally {
    setImporting(false);
  }
};

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Import FASTA
        </h1>

        <p className="mt-2 text-slate-600">
          Upload a FASTA file and preview the sequence before importing.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <label className="mb-2 block text-sm font-semibold text-slate-700">
          FASTA File
        </label>

        <input
          type="file"
          accept=".fasta,.fa,.faa,.txt"
          onChange={handleFileChange}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
        />

      </div>

      {sequence && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
<div className="mb-6 flex items-center justify-between">
  <h2 className="text-2xl font-bold text-slate-900">
    FASTA Preview
  </h2>

  <button
    onClick={handleImport}
    disabled={importing}
    className="rounded-xl bg-[#0F766E] px-6 py-3 font-semibold text-white transition hover:bg-[#0d665f] disabled:opacity-50"
  >
    {importing ? "Importing..." : "Import FASTA"}
  </button>
</div>

          <div className="space-y-5">

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Header
              </p>

              <p className="text-slate-900 break-all">
                {header}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Sequence Length
              </p>

              <p className="text-slate-900">
                {sequence.length} amino acids
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-500">
                Sequence
              </p>

              <div className="mt-2 max-h-72 overflow-y-auto rounded-lg bg-slate-50 p-4 font-mono text-sm break-all text-slate-800">
                {sequence}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}