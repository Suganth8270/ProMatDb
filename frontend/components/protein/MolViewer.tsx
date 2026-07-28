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

export interface MolViewerProps {
  /** 4-character PDB identifier, e.g. "1AO6". */
  pdbId?: string;
  /** Optional extra classes for the outer wrapper. */
  className?: string;
  /** Optional fixed height (defaults to "100%", i.e. fill the parent). */
  height?: string | number;
  /** Show the full Mol* control panel (sequence, log, controls). Defaults to false for a clean embedded viewer. */
  showControls?: boolean;
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
}: MolViewerProps) {
    console.log("MolViewer received PDB ID:", pdbId);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  const requestIdRef = useRef(0);
  const instanceId = useId();

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
      requestIdRef.current++; // invalidate any in-flight load
      pluginRef.current?.dispose();
      pluginRef.current = null;
    };
    // Intentionally initialize the plugin only once per mount; pdbId and
    // showControls changes are handled by the effects below instead of a
    // full re-init, since disposing/recreating the WebGL context on every
    // prop change is expensive and causes visible flicker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to pdbId changes on an already-initialized plugin.
  useEffect(() => {
    const plugin = pluginRef.current;
    if (!plugin) return;

    if (!pdbId) {
      requestIdRef.current++;
      plugin.clear();
      setStatus("idle");
      setErrorMessage(null);
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

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
      style={{ height }}
      data-molviewer-id={instanceId}
    >
      {/* Mol* mounts its full UI (canvas + panels) into this element. */}
      <div ref={containerRef} className="absolute inset-0" />

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
            role="status"
            aria-label="Loading structure"
          />
          <p className="text-sm font-medium text-gray-600">
            Loading structure{pdbId ? ` ${pdbId.toUpperCase()}` : ""}…
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
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
          <p className="text-sm font-semibold text-gray-800">Unable to load structure</p>
          <p className="max-w-sm text-sm text-gray-500">{errorMessage}</p>
          {pdbId && (
            <button
              type="button"
              onClick={retry}
              className="mt-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {status === "idle" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white text-gray-400">
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
          <p className="text-sm font-medium">No structure loaded</p>
        </div>
      )}
    </div>
  );
}