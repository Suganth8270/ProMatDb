"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useFetch } from "@/hooks/useFetch";
import { getBiomaterial } from "@/services/api";
import type { Biomaterial } from "@/types/biomaterial";
import {
  Atom,
  Beaker,
  Dna,
  FlaskConical,
  Heart,
  Thermometer,
  ShieldCheck,
  Leaf,
  Gauge,
  BookOpen,
  ExternalLink,
  Link2,
  FileText,
  Layers,
  Microscope,
  Sparkles,
  AlertTriangle,
  Loader2,
  Hash,
  Scale,
  ImageOff,
  Clock,
  Download,
} from "lucide-react";
import ChemicalStructure from "@/components/biomaterial/ChemicalStructure";

/**
 * Local SEM images are stored as static assets under:
 *   /public/biomaterials/sem/{id}.jpg
 * so that adding /public/biomaterials/sem/4.jpg automatically makes it
 * available for biomaterial ID 4 with no backend or data-model changes.
 */
const LOCAL_SEM_IMAGE_EXTENSION = "jpg";
const subscribeNoop = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

function getLocalSemImagePath(id: string): string {
  return `/biomaterials/sem/${id}.${LOCAL_SEM_IMAGE_EXTENSION}`;
}

function entityTypeLabel(entityType: Biomaterial["entity_type"]): string {
  if (entityType === "biomaterial") return "Biomaterial";
  if (entityType === "drug") return "Drug";
  if (entityType === "small_molecule") return "Small Molecule";
  return "Unclassified";
}

export default function BiomaterialDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";

 const mounted = useSyncExternalStore(
  subscribeNoop,
  getClientMounted,
  getServerMounted
);

  const fetcher = useCallback(() => {
    return getBiomaterial(id);
  }, [id]);

  const { data: biomaterial, loading, error } = useFetch<Biomaterial>(fetcher);

  // Local SEM image support: check (client-side, no backend involved)
  // whether /public/biomaterials/sem/{id}.jpg exists for this biomaterial.
const [localSemImage, setLocalSemImage] = useState<{
  id: string;
  path: string | null;
}>({
  id: "",
  path: null,
});

useEffect(() => {
  if (!id) return;

  let cancelled = false;
  const candidatePath = getLocalSemImagePath(id);

  fetch(candidatePath, { method: "HEAD" })
    .then((res) => {
      if (!cancelled) {
        setLocalSemImage({
          id,
          path: res.ok ? candidatePath : null,
        });
      }
    })
    .catch(() => {
      if (!cancelled) {
        setLocalSemImage({
          id,
          path: null,
        });
      }
    });

  return () => {
    cancelled = true;
  };
}, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--color-primary)]" />
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          Loading biomaterial data...
        </p>
      </div>
    );
  }

  if (error || !biomaterial) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
          <AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text)]">
          Unable to load biomaterial
        </h2>
        <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
          The biomaterial you are looking for could not be found or an error
          occurred while fetching the data. Please try again later.
        </p>
      </div>
    );
  }

  const applicationsList = biomaterial.applications
    ? biomaterial.applications
        .split(/[,;]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

const localSemImageForId =
  localSemImage.id === id ? localSemImage.path : null;

const semImageSrc = biomaterial.sem_image || localSemImageForId;
  const hasSemImage = Boolean(semImageSrc);

  const handleDownloadSemImage = async () => {
    if (!semImageSrc) return;

    try {
      const response = await fetch(semImageSrc);
      if (!response.ok) throw new Error("Failed to fetch SEM image");

      const blob = await response.blob();
      const extensionMatch = semImageSrc.match(
        /\.(png|jpe?g|webp|gif|tiff?)(\?.*)?$/i
      );
      const extension = extensionMatch ? extensionMatch[1] : "jpg";
      const safeName = biomaterial.name
        ? biomaterial.name.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "")
        : "biomaterial";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName}_SEM.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Cross-origin images without permissive CORS headers can't be fetched
      // as a blob. Fall back to opening the image directly so the user can
      // still save it manually.
      window.open(semImageSrc, "_blank", "noopener,noreferrer");
    }
  };

  const lastUpdated = biomaterial.updated_at
    ? new Date(biomaterial.updated_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
    className={`w-full pb-20 transition-opacity duration-700 ease-out ${
      mounted ? "opacity-100" : "opacity-0"
    }`}
  >
      
   
      {/* ============ MAIN CONTENT ============ */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

  <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">

    <div className="flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between">

      <div className="flex items-center gap-5">

        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
          <Atom className="h-10 w-10 text-[var(--color-primary)]" />
        </div>

        <div>

          <div className="mb-2 flex flex-wrap items-center gap-2">

            <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              {entityTypeLabel(biomaterial.entity_type)}
            </span>

            {biomaterial.category && (
              <span className="rounded-full bg-[var(--color-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                {biomaterial.category}
              </span>
            )}

          </div>

          <h1 className="text-4xl font-bold text-[var(--color-text)]">
            {biomaterial.name}
          </h1>

          <p className="mt-2 max-w-3xl text-[var(--color-text-secondary)]">
            {biomaterial.description ||
              "No description available for this biomaterial."}
          </p>

        </div>

      </div>

    </div>

  </div>

</div>
<div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
   <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">         {/* LEFT / MAIN COLUMN */}
<div className="flex flex-col gap-8">
              {/* Scientific Information Card */}
            <Card
              icon={<Atom className="h-5 w-5" />}
              title="Scientific Information"
              accent="from-emerald-500 to-teal-500"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoTile
                  icon={<Beaker className="h-4 w-4" />}
                  label="Molecular Formula"
                  value={biomaterial.molecular_formula}
                />
                <InfoTile
                  icon={<Scale className="h-4 w-4" />}
                  label="Molecular Weight"
                  value={
                    biomaterial.molecular_weight
                      ? `${biomaterial.molecular_weight} g/mol`
                      : undefined
                  }
                />
                <InfoTile
                  icon={<FlaskConical className="h-4 w-4" />}
                  label="Chemical Type"
                  value={biomaterial.chemical_type}
                />
                <InfoTile
                  icon={<Hash className="h-4 w-4" />}
                  label="PubChem CID"
                  value={biomaterial.pubchem_cid}
                 
                  link={
                    biomaterial.pubchem_cid
                      ? `https://pubchem.ncbi.nlm.nih.gov/compound/${biomaterial.pubchem_cid}`
                      : undefined
                  }
                />
                <InfoTile
                  icon={<Dna className="h-4 w-4" />}
                  label="ChEBI ID"
                  value={biomaterial.chebi_id}
                  link={
                    biomaterial.chebi_id
                      ? `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${biomaterial.chebi_id}`
                      : undefined
                  }
                />
              </div>
            </Card>

            {/* Material Properties Card */}
            <Card
              icon={<Gauge className="h-5 w-5" />}
              title="Material Properties"
              accent="from-sky-500 to-indigo-500"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PropertyBar
                  icon={<Heart className="h-4 w-4 text-[var(--color-danger)]" />}
                  label="Biocompatibility"
                  value={biomaterial.biocompatibility}
                  color="bg-[var(--color-danger)]"
                />
                <PropertyBar
                  icon={<Leaf className="h-4 w-4 text-[var(--color-emerald)]" />}
                  label="Biodegradability"
                  value={biomaterial.biodegradability}
                  color="bg-[var(--color-emerald)]"
                />
                <PropertyBar
                  icon={<Layers className="h-4 w-4 text-[var(--color-indigo)]" />}
                  label="Mechanical Strength"
                  value={biomaterial.mechanical_strength}
                  color="bg-[var(--color-indigo)]"
                />
                <PropertyBar
                  icon={<Thermometer className="h-4 w-4 text-[var(--color-warning)]" />}
                  label="Thermal Stability"
                  value={biomaterial.thermal_stability}
                  color="bg-[var(--color-warning)]"
                />
              </div>
            </Card>

            {/* Description Card */}
            <Card
              icon={<FileText className="h-5 w-5" />}
              title="Description"
              accent="from-violet-500 to-purple-500"
            >
              <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {biomaterial.description ||
                  "No description available for this biomaterial."}
              </p>
            </Card>

            {/* Biomedical Applications Card */}
            <Card
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Biomedical Applications"
              accent="from-teal-500 to-cyan-500"
            >
              {applicationsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {applicationsList.map((app, idx) => (
                    <span
                      key={`${app}-${idx}`}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3.5 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/20 hover:shadow-md"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[var(--color-primary)] transition-transform duration-300 group-hover:rotate-12" />
                      {app}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyState text="No biomedical applications listed." />
              )}
            </Card>

            {/* Chemical Structure Section (automatic, PubChem-sourced) */}
            <ChemicalStructure biomaterial={biomaterial} />

            {/* SEM Image Section */}
            <Card
              icon={<Microscope className="h-5 w-5" />}
              title="Scanning Electron Microscopy"
              accent="from-orange-500 to-amber-500"
            >
              {hasSemImage ? (
                <div className="space-y-4">
                  <div className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-slate-900 shadow-sm ring-1 ring-[var(--color-border)]/50">
                    <div className="relative h-72 w-full sm:h-96">
                      <Image
                        src={semImageSrc as string}
                        alt={`Scanning electron microscopy (SEM) image of ${biomaterial.name}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 700px"
                      />
                    </div>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <Microscope className="h-3.5 w-3.5" />
                        SEM &middot; {biomaterial.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-sm text-xs leading-5 text-[var(--color-text-muted)]">
                      Scanning electron microscopy image of {biomaterial.name}, provided for
                      reference and research purposes.
                    </p>

                    <button
                      type="button"
                      onClick={handleDownloadSemImage}
                      aria-label={`Download SEM image of ${biomaterial.name}`}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition-colors duration-300 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2"
                    >
                      <Download className="h-4 w-4" />
                      Download SEM Image
                    </button>
                  </div>
                </div>
              ) : (
                <ImagePlaceholder label="SEM image not available" dark />
              )}
            </Card>
          </div>

          {/* RIGHT / SIDEBAR COLUMN */}
         <aside className="flex flex-col gap-6 self-start">
            {/* References Card */}
            <Card
              icon={<BookOpen className="h-5 w-5" />}
              title="References"
              accent="from-slate-600 to-slate-800"
            >
              <div className="space-y-3">
              {biomaterial.doi ? (
  <a
    href={
      biomaterial.doi.startsWith("http")
        ? biomaterial.doi
        : `https://doi.org/${biomaterial.doi}`
    }
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-300 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
  >
    <span className="flex min-w-0 items-center gap-2">
      <Link2 className="h-4 w-4 shrink-0" />
      <span className="truncate">
        DOI: {biomaterial.doi}
      </span>
    </span>

    <ExternalLink className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
  </a>
) : (
  <EmptyState text="No DOI available." compact />
)}
              </div>
            </Card>

            {/* Compatible Proteins - Coming Soon */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)]/60 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-8 text-center shadow-xl">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
                  <Dna className="h-8 w-8 animate-pulse text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Compatible Proteins
                </h3>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-white/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  Coming Soon
                </span>
                <p className="mt-4 text-sm leading-relaxed text-white/80">
                  Protein compatibility mapping powered by structural
                  bioinformatics is currently in development. Check back soon
                  to explore protein interactions for this biomaterial.
                </p>
              </div>
            </div>

            {/* Quick Facts */}
            <Card
              icon={<Sparkles className="h-5 w-5" />}
              title="Quick Facts"
              accent="from-emerald-500 to-lime-500"
            >
              <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-center justify-between border-b border-dashed border-[var(--color-border-soft)] pb-2">
                  <span className="text-[var(--color-text-muted)]">Category</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {biomaterial.category || "—"}
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-dashed border-[var(--color-border-soft)] pb-2">
                  <span className="text-[var(--color-text-muted)]">Source</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {biomaterial.source || "—"}
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-dashed border-[var(--color-border-soft)] pb-2">
                  <span className="text-[var(--color-text-muted)]">Chemical Type</span>
                  <span className="font-medium text-[var(--color-text)]">
                    {biomaterial.chemical_type || "—"}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    Last Updated
                  </span>
                  <span className="font-medium text-[var(--color-text)]">
                    {lastUpdated || "—"}
                  </span>
                </li>
              </ul>
            </Card>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        @keyframes zoomOut {
          from {
            transform: scale(1.15);
          }
          to {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   Reusable Presentational Components
   ============================================================ */

function Card({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] px-6 py-4">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}
        >
          {icon}
        </div>
        <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

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

function PropertyBar({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  color: string;
}) {
  const hasValue = Boolean(value && value.trim().length > 0);
  const numeric = parsePercent(value);

  return (
    <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-soft)]/60 px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
          {icon}
          {label}
        </span>
        <span className="text-xs font-semibold text-[var(--color-text-muted)]">
          {hasValue ? value : "N/A"}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border-soft)]">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${numeric}%` }}
        />
      </div>
    </div>
  );
}

function parsePercent(value?: string): number {
  if (!value) return 0;
  const normalized = value.toLowerCase().trim();
  const map: Record<string, number> = {
    excellent: 95,
    "very high": 90,
    high: 75,
    good: 70,
    moderate: 50,
    medium: 50,
    fair: 45,
    low: 25,
    "very low": 10,
    poor: 15,
  };
  if (map[normalized] !== undefined) return map[normalized];
  const numMatch = normalized.match(/\d+(\.\d+)?/);
  if (numMatch) return Math.max(0, Math.min(100, parseFloat(numMatch[0])));
  return 50;
}

function EmptyState({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)]/50 text-[var(--color-text-muted)] ${
        compact ? "px-4 py-3 text-xs" : "px-4 py-6 text-sm justify-center"
      }`}
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function ImagePlaceholder({
  label,
  dark = false,
}: {
  label: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex h-72 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed sm:h-96 ${
        dark
          ? "border-slate-700 bg-slate-900 text-slate-500"
          : "border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]"
      }`}
    >
      <ImageOff className="h-10 w-10" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}