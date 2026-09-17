"use client";

import { useEffect, useState } from "react";

/**
 * Fetches chemical structure data for a biomaterial directly from PubChem's
 * public PUG REST API. No backend or database changes are involved — this
 * runs entirely in the browser using data already available on the page
 * (the biomaterial's PubChem CID, or its name as a fallback lookup key).
 *
 * Not every biomaterial has a single well-defined molecular structure
 * (e.g. cellulose, chitosan, collagen, PLGA are polymers/macromolecules).
 * This hook never invents or guesses data — if PubChem has no match, or a
 * particular piece of data (2D image, 3D conformer, SMILES) isn't provided,
 * the corresponding field is simply left unset so the UI can show an
 * honest "not available" state instead.
 */

export type PubChemChemistryStatus =
  | "idle"
  | "loading"
  | "ready"
  | "no-identity"
  | "not-found"
  | "error";

export interface PubChemChemistryData {
  cid: number;
  molecularFormula: string | null;
  molecularWeight: string | null;
  smiles: string | null;
  /** PubChem's official 2D structure image endpoint. Always set once a CID is resolved. */
  image2dUrl: string;
  /** Set only when PubChem confirms a 3D conformer exists for this CID. */
  sdf3dUrl: string | null;
}

export interface UsePubChemChemistryResult {
  status: PubChemChemistryStatus;
  data: PubChemChemistryData | null;
}

interface PubChemPropertyRow {
  CID: number;
  MolecularFormula?: string;
  MolecularWeight?: string;
  CanonicalSMILES?: string;
  IsomericSMILES?: string;
}

const PUBCHEM_COMPOUND_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound";

function build2dImageUrl(cid: number): string {
  return `${PUBCHEM_COMPOUND_BASE}/cid/${cid}/PNG?record_type=2d&image_size=large`;
}

function build3dSdfUrl(cid: number): string {
  return `${PUBCHEM_COMPOUND_BASE}/cid/${cid}/record/SDF/?record_type=3d`;
}

/**
 * Resolves a numeric PubChem CID. Prefers the biomaterial's stored
 * `pubchem_cid` field; falls back to a name-based PubChem lookup only when
 * that field is empty, using the biomaterial name already shown on the page.
 */
async function resolveCid(
  pubchemCid?: string,
  name?: string
): Promise<number | null> {
  const trimmedCid = pubchemCid?.trim();
  if (trimmedCid && /^\d+$/.test(trimmedCid)) {
    return parseInt(trimmedCid, 10);
  }

  const trimmedName = name?.trim();
  if (!trimmedName) return null;

  try {
    const res = await fetch(
      `${PUBCHEM_COMPOUND_BASE}/name/${encodeURIComponent(trimmedName)}/cids/JSON`
    );
    if (!res.ok) return null;

    const json = await res.json();
    const cid = json?.IdentifierList?.CID?.[0];
    return typeof cid === "number" ? cid : null;
  } catch {
    return null;
  }
}

async function fetchProperties(cid: number): Promise<PubChemPropertyRow | null> {
  try {
    const res = await fetch(
      `${PUBCHEM_COMPOUND_BASE}/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES/JSON`
    );
    if (!res.ok) return null;

    const json = await res.json();
    const row: PubChemPropertyRow | undefined = json?.PropertyTable?.Properties?.[0];
    return row ?? null;
  } catch {
    return null;
  }
}

/** Confirms whether PubChem actually has a 3D conformer before we ever try to render one. */
async function check3dAvailability(cid: number): Promise<boolean> {
  try {
    const res = await fetch(build3dSdfUrl(cid));
    return res.ok;
  } catch {
    return false;
  }
}

export function usePubChemChemistry(
  pubchemCid?: string,
  name?: string
): UsePubChemChemistryResult {
  const [status, setStatus] = useState<PubChemChemistryStatus>("idle");
  const [data, setData] = useState<PubChemChemistryData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const hasIdentity = Boolean(pubchemCid?.trim() || name?.trim());
      if (!hasIdentity) {
        setStatus("no-identity");
        setData(null);
        return;
      }

      setStatus("loading");
      setData(null);

      try {
        const cid = await resolveCid(pubchemCid, name);
        if (cancelled) return;

        if (!cid) {
          setStatus("not-found");
          return;
        }

        const [properties, has3D] = await Promise.all([
          fetchProperties(cid),
          check3dAvailability(cid),
        ]);
        if (cancelled) return;

        const smiles =
          properties?.CanonicalSMILES ?? properties?.IsomericSMILES ?? null;

        setData({
          cid,
          molecularFormula: properties?.MolecularFormula ?? null,
          molecularWeight: properties?.MolecularWeight ?? null,
          smiles,
          image2dUrl: build2dImageUrl(cid),
          sdf3dUrl: has3D ? build3dSdfUrl(cid) : null,
        });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // Only re-run when the underlying chemical identity actually changes.
  }, [pubchemCid, name]);

  return { status, data };
}