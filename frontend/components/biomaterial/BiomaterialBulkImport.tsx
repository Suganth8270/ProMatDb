"use client";

import { useState } from "react";

interface ImportResult {
  imported: number;
  duplicates: number;
  failed: number;
}

export default function BiomaterialBulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/api/biomaterials/bulk-import/",
        {
          method: "POST",
          body: formData,
        }
      );

   const data = await response.json();

setResult({
  imported: data.imported ?? 0,
  duplicates: data.duplicates ?? 0,
  failed: data.failed ?? 0,
});

    } catch (error) {
      console.error("Bulk import failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Bulk Import Biomaterials
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Upload a CSV or Excel file to import multiple biomaterials.
        </p>
      </div>

      <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
          }}
          className="mx-auto block text-sm text-slate-600"
        />

        {file && (
          <p className="mt-3 text-sm text-slate-700">
            Selected: <span className="font-medium">{file.name}</span>
          </p>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>
      {result && (
  <div className="mt-6 grid gap-3 sm:grid-cols-3">
    <div className="rounded-xl bg-emerald-50 p-4 text-center">
      <p className="text-2xl font-bold text-emerald-700">
        {result.imported}
      </p>
      <p className="text-sm font-medium text-emerald-600">
        Imported
      </p>
    </div>

    <div className="rounded-xl bg-amber-50 p-4 text-center">
      <p className="text-2xl font-bold text-amber-700">
        {result.duplicates}
      </p>
      <p className="text-sm font-medium text-amber-600">
        Duplicates
      </p>
    </div>

    <div className="rounded-xl bg-red-50 p-4 text-center">
      <p className="text-2xl font-bold text-red-700">
        {result.failed}
      </p>
      <p className="text-sm font-medium text-red-600">
        Failed
      </p>
    </div>
  </div>
)}
    </div>
  );
}