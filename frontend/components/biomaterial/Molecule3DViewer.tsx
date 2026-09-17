"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
// molstar ships its own stylesheet for the viewer chrome (toolbar, panels).
// This is a plain CSS import, safe in any Next.js App Router component file,
// and does not pull in any JavaScript module graph on its own.
import "molstar/build/viewer/molstar.css";

interface Molecule3DViewerProps {
  /** Real receptor PDB ID from the completed docking run. */
  proteinPdbId?: string;
  /** PubChem's 3D-conformer SDF endpoint for this compound. */
  sdfUrl: string;
  /** Used as the structure label inside the viewer. */
  label: string;
}

type ViewerStatus = "loading" | "ready" | "error";

/**
 * Mounts a mol* (molstar) viewer scoped to a single container div.
 *
 * IMPORTANT: this intentionally uses molstar's low-level plugin API
 * (`createPluginUI` + `DefaultPluginUISpec`) instead of the high-level
 * `Viewer` app class from `molstar/lib/apps/viewer/app`. The `Viewer` app
 * pulls in `apps/viewer/extensions.js`, which registers the built-in MP4
 * screenshot-export extension -- and that extension statically imports the
 * `h264-mp4-encoder` package, which requires Node's `fs` module at the top
 * of its file. Turbopack/webpack must resolve that import for the browser
 * bundle even though the code path is only reached dynamically, so `fs`
 * ends up in the client import graph and the build fails.
 *
 * `createPluginUI` / `DefaultPluginUISpec` build the same interactive 3D
 * canvas (rendering, camera controls, selection, etc.) without ever
 * importing the viewer app's extension registration, so `mp4-export` /
 * `h264-mp4-encoder` never enter the bundle. This was verified with a real
 * `next build` (Next 16.2.10 + Turbopack) against this exact import.
 */
export default function Molecule3DViewer({ proteinPdbId, sdfUrl, label }: Molecule3DViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pluginInstance: any = null;

    async function init() {
      if (!containerRef.current) return;
      setStatus("loading");

      try {
        // Browser-safe entry points only -- see the doc comment above for
        // why these specific modules were chosen over molstar/lib/apps/viewer.
        const [{ createPluginUI }, { renderReact18 }, { DefaultPluginUISpec }] =
          await Promise.all([
            import("molstar/lib/mol-plugin-ui/index.js"),
            import("molstar/lib/mol-plugin-ui/react18.js"),
            import("molstar/lib/mol-plugin-ui/spec.js"),
          ]);

        if (cancelled || !containerRef.current) return;

        pluginInstance = await createPluginUI({
          target: containerRef.current,
          render: renderReact18,
          spec: DefaultPluginUISpec(),
        });

        if (cancelled) {
          pluginInstance.dispose();
          return;
        }

        // Load the real receptor only for interaction-detail views.
        if (proteinPdbId?.trim()) {
          const proteinData = await pluginInstance.builders.data.download(
            {
              url: `https://models.rcsb.org/${proteinPdbId.trim( ).toLowerCase()}.bcif`,
              isBinary: true,
            },
            { state: { isGhost: true } }
          );

          const proteinTrajectory =
            await pluginInstance.builders.structure.parseTrajectory(
              proteinData,
              "mmcif"
            );

          await pluginInstance.builders.structure.hierarchy.applyPreset(
            proteinTrajectory,
            "default"
          );
        }
        // Fetch the protected SDF with the Django session cookie, then pass
        // the exact downloaded bytes to Mol* without changing coordinates.
        const ligandResponse = await fetch(sdfUrl, {
          credentials: "include",
          cache: "no-store",
        });

        if (!ligandResponse.ok) {
          throw new Error(`Docked ligand download failed with status code ${ligandResponse.status}`);
        }

        const ligandBlob = await ligandResponse.blob();
        const ligandObjectUrl = URL.createObjectURL(ligandBlob);

        const ligandData = await pluginInstance.builders.data.download(
          { url: ligandObjectUrl, isBinary: false },
          { state: { isGhost: true } }
        );

        const ligandTrajectory =
          await pluginInstance.builders.structure.parseTrajectory(
            ligandData,
            "sdf"
          );

        await pluginInstance.builders.structure.hierarchy.applyPreset(
          ligandTrajectory,
          "default"
        );

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      pluginInstance?.dispose();
    };
  }, [proteinPdbId, sdfUrl, label]);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-slate-950 sm:h-96">
      <div ref={containerRef} className="absolute inset-0" />

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/95 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-xs font-medium">Loading interactive 3D structure...</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950 px-4 text-center text-slate-400">
          <AlertTriangle className="h-6 w-6" />
          <p className="text-xs font-medium">Unable to load the 3D structure right now.</p>
        </div>
      )}
    </div>
  );
}