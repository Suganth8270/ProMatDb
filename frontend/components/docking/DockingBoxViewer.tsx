"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MolViewerCoordinateReadout } from "@/components/protein/MolViewer";

const MolViewer = dynamic(() => import("@/components/protein/MolViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-sm text-[var(--color-text-muted)]">
      Loading interactive protein structure...
    </div>
  ),
});

interface DockingBoxViewerProps {
  pdbId: string | null;
}

export default function DockingBoxViewer({ pdbId }: DockingBoxViewerProps) {
  const [readout, setReadout] = useState<MolViewerCoordinateReadout | null>(null);

  return (
    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Protein structure inspection</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Click one atom to inspect its structure-space coordinate. This readout is independent of the manual docking-box fields.
        </p>
      </div>
      {pdbId ? (
        <MolViewer
          pdbId={pdbId}
          height="20rem"
          showControls={false}
          onAtomicCoordinatePick={setReadout}
        />
      ) : (
        <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] text-sm text-[var(--color-text-muted)]">
          Select a protein with a usable PDB ID to inspect its structure.
        </div>
      )}
      <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4 text-sm text-[var(--color-text-secondary)]">
        <p className="font-semibold text-[var(--color-text)]">Structure-coordinate readout</p>
        <p className="mt-1">Coordinates appear only after a genuine atomic Mol* pick and are displayed in Å. They never populate or modify the six docking-box inputs.</p>
        <p className="mt-3 font-medium">No biological binding site, pocket, or docking-box validity is inferred.</p>
        {readout ? (
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div><dt className="font-medium">Atom</dt><dd>{readout.atomName} · {readout.residueName} {readout.authAsymId}:{readout.authSeqId}</dd></div>
            <div><dt className="font-medium">Coordinates (Å)</dt><dd>{readout.x.toFixed(3)}, {readout.y.toFixed(3)}, {readout.z.toFixed(3)}</dd></div>
            <div><dt className="font-medium">Structure</dt><dd>{readout.structureLabel}</dd></div>
            <div><dt className="font-medium">Model / assembly</dt><dd>{readout.modelIndex} / {readout.assemblyId || "default"}</dd></div>
          </dl>
        ) : (
          <p className="mt-3 text-[var(--color-text-muted)]">No atomic coordinate selected.</p>
        )}
      </div>
    </section>
  );
}
