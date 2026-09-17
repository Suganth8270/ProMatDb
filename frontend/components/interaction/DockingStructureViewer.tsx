"use client";

import "molstar/lib/mol-plugin-ui/skin/light.scss";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import {
  DefaultPluginUISpec,
  PluginUISpec,
} from "molstar/lib/mol-plugin-ui/spec";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { setSubtreeVisibility } from "molstar/lib/mol-plugin/behavior/static/state";

interface DockingStructureViewerProps {
  pdbId: string;
  ligandSdfUrl: string;
  className?: string;
  height?: string | number;
}

type ViewerStatus = "idle" | "loading" | "ready" | "error";
type LigandStatus = "idle" | "loading" | "ready" | "unavailable";
type PresetLike = Record<string, unknown>;

const RCSB_STRUCTURE_URL = (id: string) =>
  `https://models.rcsb.org/${id.toLowerCase()}.bcif`;

function collectRefsDeep(
  value: unknown,
  depth = 0,
  seen = new Set<object>()
): string[] {
  if (!value || typeof value !== "object" || depth > 5) return [];
  if (seen.has(value)) return [];
  seen.add(value);
  const record = value as PresetLike;
  const refs: string[] = [];
  if (typeof record.ref === "string") refs.push(record.ref);
  const selector = record.selector as PresetLike | undefined;
  if (typeof selector?.ref === "string") refs.push(selector.ref);
  const cell = record.cell as PresetLike | undefined;
  const transform = cell?.transform as PresetLike | undefined;
  if (typeof transform?.ref === "string") refs.push(transform.ref);
  if (Array.isArray(value)) {
    for (const item of value) refs.push(...collectRefsDeep(item, depth + 1, seen));
  } else {
    for (const [key, child] of Object.entries(record)) {
      if (key === "plugin" || key === "parent" || key === "transform") continue;
      refs.push(...collectRefsDeep(child, depth + 1, seen));
    }
  }
  return refs;
}

function getRepresentationRefs(presetResult: unknown, anchorRef: string): string[] {
  const result = presetResult as PresetLike | null;
  const refs = new Set<string>([anchorRef]);
  for (const ref of collectRefsDeep(result?.representations)) refs.add(ref);
  for (const ref of collectRefsDeep(result?.components)) refs.add(ref);
  return Array.from(refs);
}

function buildSpec(): PluginUISpec {
  return {
    ...DefaultPluginUISpec(),

    layout: {
      initial: {
        isExpanded: false,
        showControls: false,
        controlsDisplay: "reactive",
      },
    },

    config: [
      [PluginConfig.VolumeStreaming.Enabled, false],
    ],
  };
}

export default function DockingStructureViewer({
  pdbId,
  ligandSdfUrl,
  className = "",
  height = "32rem",
}: DockingStructureViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const pluginRef = useRef<PluginUIContext | null>(null);

  // Holds the in-flight (or last-settled) initialization promise so that
  // a new initialization always waits for the previous one to fully
  // finish (and dispose its plugin) before touching the container again.
  // This is what prevents the "createRoot called twice" error under
  // React Strict Mode's mount -> cleanup -> remount cycle.
  const initChainRef = useRef<Promise<void>>(Promise.resolve());

  // Bumped on every effect run. Any in-flight async step checks this
  // before writing to refs/state, so a stale (superseded) initialization
  // can never clobber a newer one or write after unmount.
  const generationRef = useRef(0);
  const isCurrentGeneration = useCallback(
    (generation: number) => generationRef.current === generation,
    []
  );

  // Overall / receptor status. This is the only thing that can put the
  // viewer into a full-screen error state, because the receptor is the
  // one piece that's essential for the viewer to mean anything.
  const [status, setStatus] =
    useState<ViewerStatus>("idle");

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  // Ligand status is tracked completely separately from `status`. A
  // ligand failure (403, 404, empty file, unparsable SDF, etc.) can
  // never flip `status` to "error" and can never hide the protein —
  // it only ever affects this piece of state.
  const [ligandStatus, setLigandStatus] =
    useState<LigandStatus>("idle");

  const [ligandMessage, setLigandMessage] =
    useState<string | null>(null);

  const [showProtein, setShowProtein] =
    useState(true);

  const [showLigand, setShowLigand] =
    useState(true);

  // Refs to every Mol* state-tree ref that belongs to each loaded
  // structure's visual representation(s), plus that structure's own
  // top-level data cell as a defensive fallback anchor. Populated after
  // each applyPreset() call - see getRepresentationRefs() below.
  const proteinRepresentationRefs = useRef<string[]>([]);

  const ligandRepresentationRefs = useRef<string[]>([]);

  /*
   * ===============================
   * REPRESENTATION REF EXTRACTION
   * ===============================
   *
   * applyPreset()'s return shape (StructureRepresentationPresetProvider.
   * Result) has changed across Mol* releases - sometimes
   * `.representations` is a flat `{ [key]: StateObjectSelector }` map,
   * sometimes individual entries are nested one level deeper (e.g. under
   * a `.selector` or `.representation` property), and `.components` can
   * hold additional selectors that themselves have associated
   * representations. Rather than assume one shape, this walks both
   * `.representations` and `.components` recursively (bounded depth,
   * scoped only to those two known containers) and collects every
   * `.ref` string it can find, from any object shape.
   */


  /*
   * ===============================
   * MOL* VISIBILITY CONTROL
   * ===============================
   *
   * setSubtreeVisibility(state, root, hidden) sets cell.state.isHidden
   * on `root` and every descendant of `root` in the state tree. We call
   * it once per collected ref (representation refs, component refs, and
   * the structure's own top-level anchor as a fallback), then force an
   * explicit Canvas3D redraw so the change is reflected immediately
   * rather than waiting on the next scheduled render tick.
   */

  const setRepresentationVisibility = (
    label: string,
    refs: string[],
    visible: boolean
  ) => {
    const plugin = pluginRef.current;

    if (!plugin) return;

    console.log(
      `Toggling ${label}:`,
      { visible, refs }
    );

    for (const ref of refs) {
      setSubtreeVisibility(
        plugin.state.data,
        ref,
        !visible
      );
    }

    // Force an immediate redraw rather than waiting on the next
    // scheduled Canvas3D render tick. Cast + optional-call defensively
    // since the exact redraw method name has varied slightly across
    // Mol* releases; this never throws if it's absent at runtime, and
    // never risks a TypeScript compile error either way.
    plugin.canvas3d?.requestDraw?.();
  };

  const toggleProteinVisibility = () => {
    setShowProtein((previous) => {
      const next = !previous;

      setRepresentationVisibility(
        "protein",
        proteinRepresentationRefs.current,
        next
      );

      return next;
    });
  };

  const toggleLigandVisibility = () => {
    setShowLigand((previous) => {
      const next = !previous;

      setRepresentationVisibility(
        "ligand",
        ligandRepresentationRefs.current,
        next
      );

      return next;
    });
  };

  /*
   * ===============================
   * LOAD DOCKED LIGAND (isolated)
   * ===============================
   *
   * This function is intentionally self-contained: every failure path
   * inside it resolves into a ligandStatus/ligandMessage update and
   * returns — nothing here ever throws out to the caller. That's what
   * guarantees a bad ligand (403, 404, empty response, invalid SDF)
   * can never take down the receptor that's already on screen.
   */
  const loadLigand = useCallback(
    async (plugin: PluginUIContext) => {
      setLigandStatus("loading");
      setLigandMessage(null);

      try {
        let response: Response;

        try {
          response = await fetch(ligandSdfUrl, {
            credentials: "include",
            cache: "no-store",
          });
        } catch {
          setLigandStatus("unavailable");
          setLigandMessage(
            "Docked ligand could not be reached."
          );
          return;
        }

        if (response.status === 403) {
          setLigandStatus("unavailable");
          setLigandMessage(
            "Docked ligand is unavailable or access is restricted."
          );
          return;
        }

        if (response.status === 404) {
          setLigandStatus("unavailable");
          setLigandMessage(
            "No docked ligand pose is available for this interaction."
          );
          return;
        }

        if (!response.ok) {
          setLigandStatus("unavailable");
          setLigandMessage(
            `Docked ligand could not be loaded (status ${response.status}).`
          );
          return;
        }

        const ligandSdfText = await response.text();

        if (!ligandSdfText.trim()) {
          setLigandStatus("unavailable");
          setLigandMessage(
            "Docked ligand file was empty."
          );
          return;
        }

        const ligandData =
          await plugin.builders.data.rawData(
            {
              data: ligandSdfText,
              label: "Docked Ligand",
            },
            {
              state: {
                isGhost: false,
              },
            }
          );

        let ligandTrajectory;

        try {
          // The file is an .sdf, and Mol* registers a distinct 'sdf'
          // trajectory format (built on the same CTab parser as 'mol',
          // but intended for this file type and multi-record SDFs).
          // Some older Mol* builds only register 'mol', so fall back to
          // that if 'sdf' isn't recognized rather than failing outright.
          ligandTrajectory =
            await plugin.builders.structure.parseTrajectory(
              ligandData,
              "sdf"
            );
        } catch (sdfFormatError) {
          console.warn(
            "'sdf' trajectory format failed, retrying with 'mol':",
            sdfFormatError
          );

          try {
            ligandTrajectory =
              await plugin.builders.structure.parseTrajectory(
                ligandData,
                "mol"
              );
          } catch (parseError) {
            console.error(
              "Ligand SDF parse error:",
              parseError
            );
            setLigandStatus("unavailable");
            setLigandMessage(
              "Docked ligand file could not be parsed (invalid SDF data)."
            );
            return;
          }
        }

        const ligandStructure =
          await plugin.builders.structure.hierarchy.applyPreset(
            ligandTrajectory,
            "default",
            {
              showUnitcell: false,
            }
          );

        // The ligand's own top-level data cell (from rawData() above),
        // completely separate from the receptor's subtree, is passed in
        // as the fallback anchor; the actual representation/component
        // refs are walked out of the preset result on top of it.
        ligandRepresentationRefs.current = getRepresentationRefs(
          ligandStructure,
          ligandData.ref
        );

        console.log(
          "Ligand representation refs:",
          ligandRepresentationRefs.current
        );

        // A fresh ligand load is visible by default.
        setShowLigand(true);

        plugin.canvas3d?.requestCameraReset();

        setLigandStatus("ready");

      } catch (error) {
        // Final safety net — should be unreachable given the guards
        // above, but ensures a ligand failure can never propagate.
        console.error(
          "Unexpected ligand loading error:",
          error
        );
        setLigandStatus("unavailable");
        setLigandMessage(
          "Docked ligand is unavailable or access is restricted."
        );
      }
    },
    [ligandSdfUrl]
  );

  /*
   * ===============================
   * LOAD RECEPTOR + TRIGGER LIGAND
   * ===============================
   */
  const loadDockingStructure = useCallback(
    async (plugin: PluginUIContext) => {
      setStatus("loading");
      setErrorMessage(null);
      setLigandStatus("idle");
      setLigandMessage(null);

      try {
        if (!/^[A-Za-z0-9]{4}$/.test(pdbId.trim())) {
          throw new Error(
            `"${pdbId}" is not a valid 4-character PDB ID.`
          );
        }

        await plugin.clear();

        proteinRepresentationRefs.current = [];
        ligandRepresentationRefs.current = [];

        /*
         * ===============================
         * LOAD RECEPTOR
         * ===============================
         */

        const receptorData =
          await plugin.builders.data.download(
            {
              url: RCSB_STRUCTURE_URL(
                pdbId.trim()
              ),
              isBinary: true,
            },
            {
              state: {
                isGhost: true,
              },
            }
          );

        const receptorTrajectory =
          await plugin.builders.structure.parseTrajectory(
            receptorData,
            "mmcif"
          );

        const receptorStructure =
          await plugin.builders.structure.hierarchy.applyPreset(
            receptorTrajectory,
            "default",
            {
              // The .bcif files served by models.rcsb.org carry
              // crystallographic cell/symmetry data, and the "default"
              // preset draws a unit-cell wireframe around the structure
              // whenever that data is present unless explicitly told
              // not to. This app only wants the receptor + ligand.
              showUnitcell: false,
            }
          );

        // The receptor's own top-level data cell is passed in as the
        // fallback anchor; the actual representation/component refs are
        // walked out of the preset result on top of it. Nothing
        // belonging to the ligand is ever part of this subtree - it
        // comes from a separate download()/rawData() call entirely.
        proteinRepresentationRefs.current = getRepresentationRefs(
          receptorStructure,
          receptorData.ref
        );

        console.log(
          "Protein representation refs:",
          proteinRepresentationRefs.current
        );

        // A fresh receptor load is visible by default.
        setShowProtein(true);

        plugin.canvas3d?.requestCameraReset();

        console.log(
          "Receptor loaded:",
          {
            receptor: receptorStructure,
            pdbId,
          }
        );

        // The receptor is up. The viewer is "ready" regardless of
        // what happens with the ligand next.
        setStatus("ready");

      } catch (error) {

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load docking structure.";

        console.error(
          "Docking structure viewer error:",
          error
        );

        setErrorMessage(message);

        setStatus("error");

        // Receptor failed outright — don't attempt the ligand.
        return;
      }

      // Ligand loading happens after (and independently of) the
      // receptor. Nothing it does can undo `status: "ready"` above.
      await loadLigand(plugin);
    },

    [
      pdbId,
      loadLigand,
    ]
  );

  /*
   * ===============================
   * INITIALIZE MOLSTAR
   * ===============================
   *
   * Initialization is serialized through initChainRef so that under
   * React Strict Mode (which mounts, cleans up, and remounts a
   * component synchronously in development) a second createPluginUI()
   * call can never start on the same container until the first one
   * has fully resolved and been disposed. Without this, the two
   * concurrent createPluginUI() calls both try to call
   * ReactDOMClient.createRoot() on the same DOM node, which is the
   * source of the "createRoot() on a container that has already been
   * passed to createRoot() before" error.
   */

  useEffect(() => {

    const container = containerRef.current;
    const generationAtCleanupRegistration = generationRef.current;

    if (!container) {
      return;
    }

    const myGeneration = ++generationRef.current;
    let cleanedUp = false;

    const previousInit = initChainRef.current;

    const thisInit = previousInit
      .catch(() => {
        // Swallow errors from a previous, now-superseded initialization
        // so they can't break this chain.
      })
      .then(async () => {

        // Dispose whatever plugin the previous generation created,
        // now that its initialization has fully settled.
        if (pluginRef.current) {
          pluginRef.current.dispose();
          pluginRef.current = null;
        }

        // If we've already been superseded or unmounted before we
        // even got our turn, don't create a plugin at all.
        if (
          cleanedUp ||
          generationRef.current !== myGeneration
        ) {
          return;
        }

        let plugin: PluginUIContext;

        try {
          plugin = await createPluginUI({
            target: container,
            spec: buildSpec(),
            render: renderReact18,
          });
        } catch (error) {
          if (
            cleanedUp ||
            generationRef.current !== myGeneration
          ) {
            return;
          }

          const message =
            error instanceof Error
              ? error.message
              : "Failed to initialize molecular viewer.";

          console.error(
            "Mol* initialization error:",
            error
          );

          setErrorMessage(message);
          setStatus("error");
          return;
        }

        // By the time createPluginUI resolves, a newer generation may
        // already be queued (or this one may have been cleaned up).
        // In that case, dispose immediately rather than adopting it.
        if (
          cleanedUp ||
          generationRef.current !== myGeneration
        ) {
          plugin.dispose();
          return;
        }

        pluginRef.current = plugin;

        await loadDockingStructure(plugin);
      });

    initChainRef.current = thisInit;

    return () => {
      cleanedUp = true;

      // Once this generation's (possibly still-pending) initialization
      // settles, make sure its plugin — if it ended up being the one
      // still installed — gets disposed.
      const cleanupGeneration = generationAtCleanupRegistration;
      thisInit.finally(() => {
        if (isCurrentGeneration(cleanupGeneration) && pluginRef.current) {
          pluginRef.current.dispose();
          pluginRef.current = null;
        }
      });
    };

  }, [isCurrentGeneration, loadDockingStructure]);

  /*
   * ===============================
   * RESET CAMERA
   * ===============================
   */

  const resetCamera = () => {

    pluginRef.current
      ?.canvas3d
      ?.requestCameraReset();

  };

  /*
   * ===============================
   * RELOAD VIEWER
   * ===============================
   */

  const reloadViewer = () => {

    const plugin = pluginRef.current;

    if (plugin) {

      loadDockingStructure(
        plugin
      );

    }

  };

  /*
   * ===============================
   * RETRY LIGAND ONLY
   * ===============================
   */

  const retryLigand = () => {

    const plugin = pluginRef.current;

    if (plugin && status === "ready") {

      loadLigand(plugin);

    }

  };

  return (

    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm ${className}`}
      style={{
        height,
      }}
    >

      {/* MOLSTAR */}

      <div
        ref={containerRef}
        className="absolute inset-0"
      />

      {/* LOADING */}

      {status === "loading" && (

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[var(--color-surface)]/95 backdrop-blur">

          <div className="h-11 w-11 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />

          <div className="text-center">

            <p className="text-sm font-semibold text-[var(--color-text)]">
              Loading Docked Complex
            </p>

            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Loading receptor and docked ligand...
            </p>

          </div>

        </div>

      )}

      {/* ERROR (receptor-level only) */}

      {status === "error" && (

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[var(--color-surface)] p-6 text-center">

          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-xl font-bold text-red-500">
            !
          </div>

          <div>

            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              Unable to load docking structure
            </h3>

            <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
              {errorMessage}
            </p>

          </div>

          <button
            type="button"
            onClick={reloadViewer}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Try Again
          </button>

        </div>

      )}

      {/* HEADER */}

      {status === "ready" && (

        <div className="absolute left-4 top-4 z-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-lg backdrop-blur">

          <p className="text-sm font-bold text-[var(--color-text)]">
            Docked Molecular Complex
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {pdbId.toUpperCase()} Receptor
            {ligandStatus === "ready" && " + Docked Ligand"}
          </p>

        </div>

      )}

      {/* LIGAND-ONLY NOTICE — protein stays visible behind this */}

      {status === "ready" &&
        ligandStatus === "unavailable" && (

          <div className="absolute right-4 top-4 z-10 max-w-xs rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs shadow-lg backdrop-blur">

            <p className="font-semibold text-amber-600">
              Ligand not shown
            </p>

            <p className="mt-1 text-[var(--color-text-secondary)]">
              {ligandMessage}
            </p>

            <button
              type="button"
              onClick={retryLigand}
              className="mt-2 rounded-lg border border-amber-500/40 px-2 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-500/10"
            >
              Retry ligand
            </button>

          </div>

        )}

      {status === "ready" &&
        ligandStatus === "loading" && (

          <div className="absolute right-4 top-4 z-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 text-xs text-[var(--color-text-muted)] shadow-lg backdrop-blur">
            Loading docked ligand...
          </div>

        )}

      {/* CONTROLS */}

      {status === "ready" && (

        <div className="absolute bottom-4 right-4 z-10 flex flex-wrap gap-2">

          <button
            type="button"
            onClick={resetCamera}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] shadow-md transition hover:bg-[var(--color-surface-soft)]"
          >
            Reset View
          </button>

          <button
            type="button"
            onClick={toggleProteinVisibility}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] shadow-md transition hover:bg-[var(--color-surface-soft)]"
          >
            {showProtein
              ? "Protein Visible"
              : "Protein Hidden"}
          </button>

          <button
            type="button"
            onClick={toggleLigandVisibility}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] shadow-md transition hover:bg-[var(--color-surface-soft)]"
          >
            {showLigand
              ? "Ligand Visible"
              : "Ligand Hidden"}
          </button>

        </div>

      )}

    </div>

  );
}
