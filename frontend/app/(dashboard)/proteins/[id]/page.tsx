// ============================================================================
// ProMatDB - Protein Details Page (Professional Redesign)
// File: frontend/app/(dashboard)/proteins/[id]/page.tsx
// ============================================================================

"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MolViewer from "@/components/protein/MolViewer";
import {
  ArrowLeft,
  Dna,
  ExternalLink,
  Database,
  Download,
  AlertTriangle,
  SearchX,
  Copy,
  Check,
  Boxes,
} from "lucide-react";

import { useFetch } from "@/hooks/useFetch";
import { getProtein, getInteractions } from "@/services/api";
import { Protein } from "@/types/protein";
import type { Interaction } from "@/types/interaction";
import InteractionCard from "@/components/interaction/InteractionCard";

function BackLink() {
  return (
    <Link
      href="/proteins"
      className="inline-flex items-center gap-2 font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
    >
      <ArrowLeft size={18} /> Back to Proteins
    </Link>
  );
}

export default function ProteinDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const fetchProtein = useCallback(() => getProtein(id), [id]);
  const { data: protein, loading, error } = useFetch<Protein>(fetchProtein);
  const [sequenceCopied, setSequenceCopied] = useState(false);

  // Related interactions are supplementary data: fetched only once the
  // protein itself is available, and this request's own loading/error
  // state must never affect the main protein loading/error states above.
  // There is no protein-scoped interactions endpoint, so we fetch all
  // interactions and filter by numeric protein.id client-side.
  const fetchProteinInteractions = useCallback(async () => {
    if (!protein) return [];
    const allInteractions = await getInteractions();
    return allInteractions.filter(
      (interaction) => interaction.protein.id === protein.id
    );
  }, [protein]);

  const {
    data: interactions,
    loading: interactionsLoading,
    error: interactionsError,
  } = useFetch<Interaction[]>(fetchProteinInteractions);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 animate-pulse rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-5">
                <div className="h-[72px] w-[72px] rounded-2xl bg-[var(--color-surface-soft)]" />
                <div className="space-y-3">
                  <div className="h-9 w-64 rounded bg-[var(--color-surface-soft)]" />
                  <div className="h-4 w-40 rounded bg-[var(--color-surface-soft)]" />
                  <div className="flex gap-3">
                    <div className="h-8 w-28 rounded-full bg-[var(--color-surface-soft)]" />
                    <div className="h-8 w-28 rounded-full bg-[var(--color-surface-soft)]" />
                    <div className="h-8 w-24 rounded-full bg-[var(--color-surface-soft)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="h-40 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" />
            <div className="h-32 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" />
            <div className="h-56 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-6 text-[var(--color-danger)]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" />
            <div>
              <p className="font-semibold">Couldn&apos;t load this protein</p>
              <p className="mt-1 text-sm text-[var(--color-danger)]">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!protein) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] p-8">
        <div className="mx-auto max-w-6xl">
          <BackLink />

          <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-20 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-soft)]">
              <SearchX className="h-7 w-7 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-lg font-semibold text-[var(--color-text)]">
              Protein not found
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">
              We couldn&apos;t find a protein with this ID. It may have been
              removed or the link may be incorrect.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function downloadFasta() {
    const fasta = `>${protein!.protein_name}\n${protein!.sequence}`;
    const blob = new Blob([fasta], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${protein!.uniprot_id}.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copySequence() {
    try {
      await navigator.clipboard.writeText(protein!.sequence);
      setSequenceCopied(true);
      setTimeout(() => setSequenceCopied(false), 2000);
    } catch {
      // Clipboard access can fail (unsupported browser, permissions, etc.);
      // fail silently rather than interrupting the user.
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8">
      <div className="mx-auto max-w-6xl">

        <BackLink />

        <div className="mt-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">

          {/* Record eyebrow strip: reads like a database record header */}
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-soft)] px-8 py-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
              Protein Record
            </span>
            <span className="font-data text-xs font-semibold text-[var(--color-text-muted)]">
              {protein.uniprot_id}
            </span>
          </div>

          <div className="p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

              <div className="flex min-w-0 items-start gap-5">
                <div className="shrink-0 rounded-2xl bg-[var(--color-primary)]/10 p-4">
                  <Dna className="h-10 w-10 text-[var(--color-primary)]" />
                </div>

                <div className="min-w-0">
                  <h1 className="break-words text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
                    {protein.protein_name}
                  </h1>

                  <p className="mt-1.5 text-base font-medium text-[var(--color-text-secondary)]">
                    {protein.organism}
                  </p>

                  {protein.function && (
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] line-clamp-2">
                      {protein.function}
                    </p>
                  )}

                  {/* Identifier chips: monospace data values, consistent with ProteinCard */}
                  <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        UniProt ID
                      </dt>
                      <dd className="mt-1 inline-block rounded-lg bg-[var(--color-emerald)]/10 px-2.5 py-1 font-data text-sm font-semibold text-[var(--color-emerald)]">
                        {protein.uniprot_id}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        PDB ID
                      </dt>
                      <dd
                        className={`mt-1 inline-block rounded-lg px-2.5 py-1 font-data text-sm font-semibold ${
                          protein.pdb_id
                            ? "bg-[var(--color-indigo)]/10 text-[var(--color-indigo)]"
                            : "bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {protein.pdb_id || "Not linked"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                        Molecular Weight
                      </dt>
                      <dd className="mt-1 inline-block rounded-lg border border-[var(--color-border)] px-2.5 py-1 font-data text-sm font-semibold text-[var(--color-text)]">
                        {protein.molecular_weight.toLocaleString()} Da
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:shrink-0">
                <a href={`https://www.uniprot.org/uniprotkb/${protein.uniprot_id}`} target="_blank"
                   className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]">
                  <ExternalLink size={18}/> UniProt
                </a>

                {protein.pdb_id && (
                  <a href={`https://www.rcsb.org/structure/${protein.pdb_id}`} target="_blank"
                     className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-indigo)] px-5 py-3 font-semibold text-white transition-colors hover:opacity-90">
                    <Database size={18}/> PDB
                  </a>
                )}

                <button onClick={downloadFasta}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-slate-800">
                  <Download size={18}/> FASTA
                </button>
              </div>

            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-[var(--color-text)]">General Information</h2>
            <div className="grid gap-x-6 gap-y-4 text-[var(--color-text)] md:grid-cols-2">
              <div className="flex justify-between gap-4 border-b border-[var(--color-border-soft)] pb-3 md:border-none md:pb-0">
                <span className="font-semibold text-[var(--color-text-muted)]">UniProt</span>
                <span className="text-right">{protein.uniprot_id}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-[var(--color-border-soft)] pb-3 md:border-none md:pb-0">
                <span className="font-semibold text-[var(--color-text-muted)]">PDB</span>
                <span className="text-right">{protein.pdb_id || "Not Linked"}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-[var(--color-border-soft)] pb-3 md:border-none md:pb-0">
                <span className="font-semibold text-[var(--color-text-muted)]">Organism</span>
                <span className="text-right">{protein.organism}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-[var(--color-text-muted)]">Molecular Weight</span>
                <span className="text-right">{protein.molecular_weight.toLocaleString()} Da</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-[var(--color-text)]">Biological Function</h2>
            <p className="leading-7 text-[var(--color-text-secondary)]">{protein.function}</p>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[var(--color-text)]">Amino Acid Sequence</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-[var(--color-text-muted)]">
                  {protein.sequence.length.toLocaleString()} residues
                </span>
                <button
                  onClick={copySequence}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  {sequenceCopied ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Sequence
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-auto rounded-xl bg-[var(--color-surface-soft)] p-4">
              <pre className="whitespace-pre-wrap break-all font-mono text-sm leading-6 text-[var(--color-text)]">
                {protein.sequence}
              </pre>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border-soft)] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[var(--color-primary)]/10 p-2.5">
                  <Boxes className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">3D Protein Structure</h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {protein.pdb_id
                      ? "Interactive structure rendered with Mol*"
                      : "No experimental structure linked to this record"}
                  </p>
                </div>
              </div>

              {protein.pdb_id && (
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[var(--color-indigo)]/10 px-3 py-1.5 font-data text-sm font-semibold text-[var(--color-indigo)]">
                    PDB: {protein.pdb_id}
                  </span>
                  <a
                    href={`https://www.rcsb.org/structure/${protein.pdb_id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  >
                    <ExternalLink size={14} /> View on RCSB
                  </a>
                </div>
              )}
            </div>

            <div className="p-6">
              {protein.pdb_id ? (
                <MolViewer pdbId={protein.pdb_id} height={650} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] px-6 py-20 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
                    <Boxes className="h-7 w-7 text-[var(--color-text-muted)]" />
                  </div>
                  <p className="text-base font-semibold text-[var(--color-text)]">
                    3D structure is not available for this protein.
                  </p>
                  <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
                    This record has no linked PDB ID, so no experimental structure
                    can be rendered.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[var(--color-text)]">External Scientific Resources</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              ProMatDB &rarr; UniProt &rarr; RCSB PDB &rarr; 3D Structure
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

              {/* UniProt */}
              <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-5">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-[var(--color-emerald)]/10 p-2">
                    <Database className="h-4 w-4 text-[var(--color-emerald)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)]">UniProt</h3>
                </div>

                <p className="mt-3 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  Sequence & functional annotation
                </p>
                <p className="mt-1 font-data text-sm font-semibold text-[var(--color-text)]">
                  {protein.uniprot_id || "Not available"}
                </p>

                <div className="mt-4">
                  {protein.uniprot_id ? (
                    <a
                      href={`https://www.uniprot.org/uniprotkb/${protein.uniprot_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open UniProt entry ${protein.uniprot_id} in a new tab`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
                    >
                      <ExternalLink size={14} /> Open UniProt
                    </a>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]">
                      UniProt ID not linked
                    </span>
                  )}
                </div>
              </div>

              {/* RCSB PDB */}
              <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-5">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-[var(--color-indigo)]/10 p-2">
                    <Boxes className="h-4 w-4 text-[var(--color-indigo)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)]">RCSB PDB</h3>
                </div>

                <p className="mt-3 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  Experimental 3D structure
                </p>
                <p className="mt-1 font-data text-sm font-semibold text-[var(--color-text)]">
                  {protein.pdb_id || "Not available"}
                </p>

                <div className="mt-4">
                  {protein.pdb_id ? (
                    <a
                      href={`https://www.rcsb.org/structure/${protein.pdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View RCSB PDB structure ${protein.pdb_id} in a new tab`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-indigo)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                    >
                      <ExternalLink size={14} /> View Structure
                    </a>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]">
                      Structure not linked
                    </span>
                  )}
                </div>
              </div>

              {/* FASTA */}
              <div className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-5">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-[var(--color-primary)]/10 p-2">
                    <Dna className="h-4 w-4 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-text)]">FASTA</h3>
                </div>

                <p className="mt-3 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  Protein sequence record
                </p>
                <p className="mt-1 font-data text-sm font-semibold text-[var(--color-text)]">
                  {protein.uniprot_id || protein.protein_name}.fasta
                </p>

                <div className="mt-4">
                  <button
                    onClick={downloadFasta}
                    aria-label={`Download FASTA record for ${protein.protein_name}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    <Download size={14} /> Download FASTA
                  </button>
                </div>
              </div>

            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--color-text)]">Related Interactions</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Protein&ndash;biomaterial interactions currently recorded in ProMatDB.
            </p>

            <div className="mt-5">
              {interactionsLoading && (
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-secondary)] shadow-sm">
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
                  Loading related interactions&hellip;
                </div>
              )}

              {!interactionsLoading && interactionsError && (
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-5 text-[var(--color-danger)]">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" />
                  <div>
                    <p className="font-semibold">Couldn&apos;t load related interactions</p>
                    <p className="mt-1 text-sm text-[var(--color-danger)]">{interactionsError}</p>
                  </div>
                </div>
              )}

              {!interactionsLoading && !interactionsError && interactions && interactions.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center shadow-sm">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-soft)]">
                    <Boxes className="h-6 w-6 text-[var(--color-text-muted)]" />
                  </div>
                  <p className="font-semibold text-[var(--color-text)]">
                    No interactions recorded
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">
                    No protein&ndash;biomaterial interactions are currently associated
                    with this protein.
                  </p>
                </div>
              )}

              {!interactionsLoading && !interactionsError && interactions && interactions.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {interactions.map((interaction) => (
                    <InteractionCard key={interaction.id} interaction={interaction} />
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}