"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  Atom,
  Beaker,
  Scale,
  Hash,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  ImageOff,
  Box,
  ExternalLink,
} from "lucide-react";
import type { Biomaterial } from "@/types/biomaterial";
import { usePubChemChemistry } from "@/hooks/usePubChemChemistry";

// mol* touches the DOM/WebGL at load time, so it must never be evaluated on
// the server. Loading it dynamically keeps the rest of this page (and the
// working SEM/SMILES-adjacent sections) completely unaffected.
const Molecule3DViewer = dynamic(() => import("./Molecule3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-slate-950 text-slate-400 sm:h-96">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
});

interface ChemicalStructureProps {
  biomaterial: Biomaterial;
}

export default function ChemicalStructure({ biomaterial }: ChemicalStructureProps) {
  const { status, data } = usePubChemChemistry(biomaterial.pubchem_cid, biomaterial.name);

  const [copied, setCopied] = useState(false);
const image2dUrl = data?.image2dUrl ?? null;

const [image2dState, setImage2dState] = useState({
  url: null as string | null,
  failed: false,
});

if (image2dState.url !== image2dUrl) {
  setImage2dState({
    url: image2dUrl,
    failed: false,
  });
}

const image2dFailed = image2dState.failed;

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopySmiles = async () => {
    if (!data?.smiles) return;
    try {
      await navigator.clipboard.writeText(data.smiles);
      setCopied(true);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context). Fail silently.
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-sm">
          <Atom className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          Chemical Structure
        </h2>
      </div>

      <div className="space-y-6 px-6 py-5">
        {status === "loading" && (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-soft)]/60 px-4 py-3.5 text-sm text-[var(--color-text-secondary)]">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--color-primary)]" />
            Retrieving chemical structure from PubChem...
          </div>
        )}

        {(status === "no-identity" || status === "not-found") && (
          <ChemistryEmptyState text="Structured molecular representation is not available for this biomaterial." />
        )}

        {status === "error" && (
          <ChemistryEmptyState
            text="PubChem is temporarily unavailable. Please try again later."
            isWarning
          />
        )}

        {status === "ready" && data && (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 2D Structure */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  2D Structure
                </p>
                {!image2dFailed ? (
                  <div className="group relative h-72 w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] sm:h-96">
                    <Image
                      src={data.image2dUrl}
                      alt={`${biomaterial.name} 2D chemical structure`}
                      fill
                      unoptimized
                      onError={() =>
  setImage2dState({
    url: image2dUrl,
    failed: true,
  })
}
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 500px"
                    />
                  </div>
                ) : (
                  <ImagePlaceholder label="2D structure image unavailable" />
                )}
              </div>

              {/* Interactive 3D Structure */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Interactive 3D Structure
                </p>
                {data.sdf3dUrl ? (
                  <Molecule3DViewer sdfUrl={data.sdf3dUrl} label={biomaterial.name} />
                ) : (
                  <div className="flex h-72 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 text-center text-[var(--color-text-muted)] sm:h-96">
                    <Box className="h-8 w-8" />
                    <p className="max-w-[240px] text-sm font-medium">
                      3D molecular structure is not available for this biomaterial.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chemical Information */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                Chemical Information
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoTile
                  icon={<Beaker className="h-4 w-4" />}
                  label="Molecular Formula"
                  value={data.molecularFormula ?? undefined}
                />
                <InfoTile
                  icon={<Scale className="h-4 w-4" />}
                  label="Molecular Weight"
                  value={
                    data.molecularWeight ? `${data.molecularWeight} g/mol` : undefined
                  }
                />
                <InfoTile
                  icon={<Hash className="h-4 w-4" />}
                  label="PubChem CID"
                  value={String(data.cid)}
                  link={`https://pubchem.ncbi.nlm.nih.gov/compound/${data.cid}`}
                />
              </div>
            </div>

            {/* SMILES */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                SMILES
              </p>
              {data.smiles ? (
                <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3.5 sm:flex-row sm:items-start">
                  <code className="min-w-0 flex-1 break-all font-mono text-sm leading-6 text-[var(--color-text)]">
                    {data.smiles}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySmiles}
                    aria-label="Copy SMILES to clipboard"
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors duration-300 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy SMILES
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <ChemistryEmptyState
                  text="SMILES representation is not available for this biomaterial."
                  compact
                />
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   Local presentational helpers (mirrors the styling used
   elsewhere on the Biomaterial Detail page)
   ============================================================ */

function InfoTile({
  icon,
  label,
  value,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  link?: string;
}) {
  const hasValue = Boolean(value && value.trim().length > 0);

  const content = (
    <div className="group flex items-start gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-soft)]/60 px-4 py-3 transition-all duration-300 hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-border-soft)] transition-colors duration-300 group-hover:text-[var(--color-primary-hover)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--color-text)]">
          {hasValue ? value : "Not available"}
        </p>
      </div>
      {link && hasValue && (
        <ExternalLink className="ml-auto mt-1 h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)] transition-colors duration-300 group-hover:text-[var(--color-primary)]" />
      )}
    </div>
  );

  if (link && hasValue) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}

function ChemistryEmptyState({
  text,
  compact = false,
  isWarning = false,
}: {
  text: string;
  compact?: boolean;
  isWarning?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)]/50 text-[var(--color-text-muted)] ${
        compact ? "px-4 py-3 text-xs" : "px-4 py-6 text-sm justify-center"
      }`}
    >
      <AlertTriangle
        className={`h-3.5 w-3.5 shrink-0 ${
          isWarning ? "text-[var(--color-danger)]" : ""
        }`}
      />
      <span>{text}</span>
    </div>
  );
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-72 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] sm:h-96">
      <ImageOff className="h-10 w-10" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}