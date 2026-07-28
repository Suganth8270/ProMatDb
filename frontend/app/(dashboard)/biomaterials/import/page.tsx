"use client";

export default function ImportBiomaterialPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white shadow-xl">

        <h1 className="text-4xl font-bold">
          Import Biomaterial
        </h1>

        <p className="mt-3 text-emerald-100">
          Search biomaterials from external scientific databases and import
          them into ProMatDB.
        </p>

      </section>

      {/* Search Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

        <label className="mb-3 block text-lg font-semibold text-slate-900">
          Biomaterial Name
        </label>

        <input
          type="text"
          placeholder="Example: Cellulose"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
        />

        <button
          className="mt-6 rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          Search PubChem
        </button>

      </section>

      {/* Preview (Next Step) */}

    </div>
  );
}