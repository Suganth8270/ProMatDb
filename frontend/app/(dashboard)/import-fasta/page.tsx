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
        <h1 className="text-3xl font-bold text-[var(--color-text)]">
          Import FASTA
        </h1>

        <p className="mt-2 text-[var(--color-text-secondary)]">
          Upload a FASTA file and preview the sequence before importing.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">

        <label className="mb-2 block text-sm font-semibold text-[var(--color-text-secondary)]">
          FASTA File
        </label>

        <input
          type="file"
          accept=".fasta,.fa,.faa,.txt"
          onChange={handleFileChange}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)]"
        />

      </div>

      {sequence && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
<div className="mb-6 flex items-center justify-between">
  <h2 className="text-2xl font-bold text-[var(--color-text)]">
    FASTA Preview
  </h2>

  <button
    onClick={handleImport}
    disabled={importing}
    className="rounded-xl bg-[var(--color-primary)] px-6 py-3 font-semibold text-white transition hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
  >
    {importing ? "Importing..." : "Import FASTA"}
  </button>
</div>

          <div className="space-y-5">

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Header
              </p>

              <p className="text-[var(--color-text)] break-all">
                {header}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Sequence Length
              </p>

              <p className="text-[var(--color-text)]">
                {sequence.length} amino acids
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Sequence
              </p>

              <div className="mt-2 max-h-72 overflow-y-auto rounded-lg bg-[var(--color-surface-soft)] p-4 font-mono text-sm break-all text-[var(--color-text)]">
                {sequence}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}