"use client";

/**
 * MolViewer.tsx
 *
 * Production-ready protein structure viewer built on Mol* (MolStar) 5.10.1.
 *
 * Requires this component to run only on the client (Mol* touches `window`
 * and WebGL), so it must either be used directly inside a Client Component
 * tree, or dynamically imported with `ssr: false`:
 *
 *   const MolViewer = dynamic(() => import("@/components/MolViewer"), { ssr: false });
 *
 * Mol*'s default skin stylesheet is a `.scss` file. Import it once, either
 * here or in your global stylesheet. If your Next.js config does not already
 * support Sass, install it:
 *
 *   npm install -D sass
 *
 * and keep the import below. If you would rather avoid a Sass dependency
 * entirely, replace this import with the pre-compiled CSS shipped at
 * "molstar/build/viewer/molstar.css" instead.
 */
import "molstar/lib/mol-plugin-ui/skin/light.scss";

import { useEffect, useRef, useState, useCallback, useId } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { DefaultPluginUISpec, PluginUISpec } from "molstar/lib/mol-plugin-ui/spec";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { OrderedSet } from "molstar/lib/mol-data/int";
import { StructureElement, StructureProperties, Unit } from "molstar/lib/mol-model/structure";

export interface MolViewerCoordinateReadout {
  x: number;
  y: number;
  z: number;
  units: "angstrom";
  structureLabel: string;
  modelIndex: number;
  assemblyId: string;
  atomName: string;
  residueName: string;
  authAsymId: string;
  authSeqId: number;
}

export interface MolViewerProps {
  /** 4-character PDB identifier, e.g. "1AO6". */
  pdbId?: string;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
  /** Optional fixed height (defaults to "100%", i.e. fill the parent). */
  height?: string | number;
  /** Show the full Mol* control panel (sequence, log, controls). Defaults to false for a clean embedded viewer. */
  showControls?: boolean;
  /** Emits only a genuine single-atom Mol* pick; never emits screen/canvas coordinates. */
  onAtomicCoordinatePick?: (coordinate: MolViewerCoordinateReadout) => void;
}

type ViewerStatus = "idle" | "loading" | "ready" | "error";

const RCSB_STRUCTURE_URL = (id: string) =>
  `https://models.rcsb.org/${id.toLowerCase()}.bcif`;

function buildSpec(showControls: boolean): PluginUISpec {
  return {
    ...DefaultPluginUISpec(),
    layout: {
      initial: {
        isExpanded: false,
        showControls,
        controlsDisplay: "reactive",
      },
    },
    config: [[PluginConfig.VolumeStreaming.Enabled, false]],
  };
}

export default function MolViewer({
  pdbId,
  className = "",
  height = "100%",
  showControls = false,
  onAtomicCoordinatePick,
}: MolViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  const requestIdRef = useRef(0);
  const instanceId = useId();
  const invalidateRequests = useCallback(() => {
    requestIdRef.current++;
  }, []);

  const [status, setStatus] = useState<ViewerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Loads (or reloads) a structure by PDB ID into an already-initialized
   * plugin instance. Uses a monotonically increasing request id so that
   * stale, in-flight loads triggered by a rapidly-changing `pdbId` prop
   * never clobber a newer result.
   */
  const loadStructure = useCallback(async (plugin: PluginUIContext, id: string) => {
    const requestId = ++requestIdRef.current;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const trimmedId = id.trim();
      if (!/^[A-Za-z0-9]{4}$/.test(trimmedId)) {
        throw new Error(`"${id}" is not a valid 4-character PDB ID.`);
      }

      // Clear any previously loaded structure before loading the next one.
      await plugin.clear();

      const data = await plugin.builders.data.download(
        { url: RCSB_STRUCTURE_URL(trimmedId), isBinary: true },
        { state: { isGhost: true } }
      );

      // A stale request (superseded by a newer pdbId change) should not
      // continue mutating plugin state.
      if (requestId !== requestIdRef.current) return;

      const trajectory = await plugin.builders.structure.parseTrajectory(data, "mmcif");
      if (requestId !== requestIdRef.current) return;

      await plugin.builders.structure.hierarchy.applyPreset(trajectory, "default");
      if (requestId !== requestIdRef.current) return;

      plugin.canvas3d?.requestCameraReset();
      setStatus("ready");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to load the requested structure.";
      setErrorMessage(message);
      setStatus("error");
    }
  }, []);

  // Initialize the plugin once on mount, tear it down on unmount.
 useEffect(() => {
  let cancelled = false;
  let clickSubscription: { unsubscribe: () => void } | undefined;

  async function init() {
    if (!containerRef.current) return;

    // Destroy existing plugin (React Strict Mode fix)
    if (pluginRef.current) {
      pluginRef.current.dispose();
      pluginRef.current = null;
    }

    // Clear previous React root
    containerRef.current.innerHTML = "";

    try {
      const plugin = await createPluginUI({
        target: containerRef.current,
        spec: buildSpec(showControls),
        render: renderReact18,
      });

        if (cancelled) {
          plugin.dispose();
          return;
        }

        pluginRef.current = plugin;

        // Read only a genuine atomic structure-space location. Do not use
        // event.position or any mouse/canvas/screen coordinate conversion.
        clickSubscription = plugin.behaviors.interaction.click.subscribe((event) => {
          if (!onAtomicCoordinatePick) return;
          const loci = event.current?.loci;
          if (!loci || !StructureElement.Loci.is(loci)) return;
          if (loci.elements.length !== 1) return;
          const unitLoci = loci.elements[0];
          if (OrderedSet.size(unitLoci.indices) !== 1 || !Unit.isAtomic(unitLoci.unit)) return;

          const unitIndex = OrderedSet.getAt(unitLoci.indices, 0);
          const element = unitLoci.unit.elements[unitIndex];
          const location = StructureElement.Location.create(loci.structure, unitLoci.unit, element);
          const x = StructureProperties.atom.x(location);
          const y = StructureProperties.atom.y(location);
          const z = StructureProperties.atom.z(location);
          if (![x, y, z].every(Number.isFinite)) return;

          onAtomicCoordinatePick({
            x,
            y,
            z,
            units: "angstrom",
            structureLabel: loci.structure.label,
            modelIndex: StructureProperties.unit.model_index(location),
            assemblyId: StructureProperties.unit.pdbx_struct_assembly_id(location),
            atomName: StructureProperties.atom.auth_atom_id(location),
            residueName: StructureProperties.atom.auth_comp_id(location),
            authAsymId: StructureProperties.chain.auth_asym_id(location),
            authSeqId: StructureProperties.residue.auth_seq_id(location),
          });
        });

        if (pdbId) {
          await loadStructure(plugin, pdbId);
        } else {
          setStatus("idle");
        }
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to initialize the molecular viewer.";
        setErrorMessage(message);
        setStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      invalidateRequests(); // invalidate any in-flight load
      clickSubscription?.unsubscribe();
      clickSubscription = undefined;
      pluginRef.current?.dispose();
      pluginRef.current = null;
    };
    // Intentionally initialize the plugin only once per mount; pdbId and
    // showControls changes are handled by the effects below instead of a
    // full re-init, since disposing/recreating the WebGL context on every
    // prop change is expensive and causes visible flicker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidateRequests]);

  // React to pdbId changes on an already-initialized plugin.
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin) return;

    if (!pdbId) {
      const myRequestId = ++requestIdRef.current;
      void plugin.clear().then(() => {
        if (myRequestId !== requestIdRef.current) return;
        setStatus("idle");
        setErrorMessage(null);
      });
      return;
    }

    loadStructure(plugin, pdbId);
  }, [pdbId, loadStructure]);

  const retry = useCallback(() => {
    const plugin = pluginRef.current;
    if (plugin && pdbId) {
      loadStructure(plugin, pdbId);
    }
  }, [pdbId, loadStructure]);

  const molstarThemeCss = `
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin {
      color: var(--color-text) !important;
      background-color: var(--color-surface) !important;
    }
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-layout,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-layout-left,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-layout-right,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-viewport,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-sequence,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-sequence-wrapper-non-empty {
      color: var(--color-text) !important;
      background-color: var(--color-surface) !important;
    }
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin button,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin input,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin select,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin textarea,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-form-control {
      color: var(--color-text) !important;
      background-color: var(--color-surface-soft) !important;
      border-color: var(--color-border) !important;
    }
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin a,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin label,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-control-group-header {
      color: var(--color-text-secondary) !important;
    }
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-background-tasks,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-hover-box-body,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-viewport-controls-panel,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-transform-wrapper,
    .dark [data-molviewer-id="${instanceId}"] .msp-plugin .msp-transform-default-params {
      color: var(--color-text) !important;
      background-color: var(--color-surface-soft) !important;
      border-color: var(--color-border) !important;
    }
  `;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm ${className}`}
      style={{ height }}
      data-molviewer-id={instanceId}
    >
      <style>{molstarThemeCss}</style>
      {/* Mol* mounts its full UI (canvas + panels) into this element. */}
      <div ref={containerRef} className="absolute inset-0" />

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface)]/85 backdrop-blur-sm">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600"
            role="status"
            aria-label="Loading structure"
          />
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Loading structure{pdbId ? ` ${pdbId.toUpperCase()}` : ""}…
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface)] p-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Unable to load structure</p>
          <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{errorMessage}</p>
          {pdbId && (
            <button
              type="button"
              onClick={retry}
              className="mt-1 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {status === "idle" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface)] text-[var(--color-text-muted)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M3 12h18" />
          </svg>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">No structure loaded</p>
        </div>
      )}
    </div>
  );
}
