"use client";

import { CSSProperties, useEffect, useRef } from "react";

const helixes = [
  ["h1", "-18%", "18%", "-22deg", "1.1"],
  ["h2", "13%", "3%", "28deg", "0.92"],
  ["h3", "42%", "27%", "-35deg", "1"],
  ["h4", "63%", "4%", "22deg", "0.84"],
  ["h5", "39%", "57%", "-17deg", "0.9"],
  ["h6", "-1%", "69%", "37deg", "0.76"],
];

const pores = Array.from({ length: 22 }, (_, index) => index);
const particles = Array.from({ length: 14 }, (_, index) => index);
const bonds = Array.from({ length: 6 }, (_, index) => index);
const atoms = Array.from({ length: 26 }, (_, index) => index);
const surfacePores = Array.from({ length: 28 }, (_, index) => index);

export default function MolecularScene({ compact = false }: { compact?: boolean }) {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let frame = 0;
    const handleMove = (event: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          scene.style.setProperty("--scene-x", `${x * 5}deg`);
          scene.style.setProperty("--scene-y", `${y * -4}deg`);
          scene.style.setProperty("--light-x", `${50 + x * 18}%`);
          scene.style.setProperty("--light-y", `${34 + y * 12}%`);
          frame = 0;
        });
      }
    };
    const reset = () => {
      scene.style.setProperty("--scene-x", "0deg");
      scene.style.setProperty("--scene-y", "0deg");
      scene.style.setProperty("--light-x", "50%");
      scene.style.setProperty("--light-y", "34%");
    };
    scene.addEventListener("pointermove", handleMove, { passive: true });
    scene.addEventListener("pointerleave", reset);
    return () => {
      scene.removeEventListener("pointermove", handleMove);
      scene.removeEventListener("pointerleave", reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (compact) {
    return (
      <div ref={sceneRef} className="molecular-scene-new is-compact" role="img" aria-label="Conceptual 3D visualization of a protein interacting with a porous biomaterial scaffold">
        <div className="scene-light-cone" /><div className="scene-haze" />
        <div className="scene-world">
          <div className="scene-orbit-new orbit-a" /><div className="scene-orbit-new orbit-b" /><div className="scene-orbit-new orbit-c" />
          <div className="protein-model"><div className="protein-core-new" />{helixes.map(([name, left, top, rotate, scale]) => <span key={name} className={`protein-helix ${name}`} style={{ "--left": left, "--top": top, "--rotate": rotate, "--scale": scale } as CSSProperties}><i /><i /><i /><i /><i /><i /></span>)}<div className="protein-sphere sphere-one" /><div className="protein-sphere sphere-two" /><div className="protein-sphere sphere-three" /></div>
          <div className="interaction-zone"><div className="binding-aura" />{bonds.map((bond) => <span key={bond} className="binding-point" />)}<i>+</i><b>binding interface</b></div>
          <div className="scaffold-model"><div className="scaffold-front">{pores.map((p) => <span key={p} style={{ "--p": p } as CSSProperties} />)}</div><div className="scaffold-side" /><div className="scaffold-glow" /></div>
          <div className="scene-pedestal"><div className="pedestal-face"><b>ProMatDB</b><small>MOLECULAR INTERFACE · LIVE VIEW</small></div><div className="pedestal-edge" /></div>
          {particles.map((p) => <span className="scene-particle-new" key={p} style={{ "--particle": p } as CSSProperties} />)}
        </div>
        <div className="scene-coordinate-new"><span>Y</span><i /><span>Z</span></div><div className="scene-status"><span className="status-pulse" /> INTERACTION FIELD · ACTIVE</div>
      </div>
    );
  }

  return (
    <div ref={sceneRef} className="molecular-scene-new hero-prototype" role="img" aria-label="Cinematic scientific prototype showing a protein approaching, orienting, and binding to a porous biomaterial surface">
      <div className="hero-prototype-light" />
      <div className="hero-prototype-depth" />
      <div className="hero-prototype-world">
        <div className="hero-trajectory trajectory-one" /><div className="hero-trajectory trajectory-two" />
        <div className="hero-protein">
          <div className="hero-protein-shell" />
          <div className="hero-protein-core" />
          <div className="hero-protein-domain domain-one" /><div className="hero-protein-domain domain-two" /><div className="hero-protein-domain domain-three" />
          {helixes.map(([name, left, top, rotate, scale]) => <span key={name} className={`hero-helix ${name}`} style={{ "--left": left, "--top": top, "--rotate": rotate, "--scale": scale } as CSSProperties}><i /><i /><i /><i /><i /><i /><i /></span>)}
          {atoms.map((atom) => <span key={atom} className="hero-atom" style={{ "--atom": atom } as CSSProperties} />)}
        </div>
        <div className="hero-approach-vector"><span /><b>APPROACH</b></div>
        <div className="hero-binding-field"><div className="field-ring ring-one" /><div className="field-ring ring-two" /><div className="field-core" />{bonds.map((bond) => <span key={bond} className="hero-bond" style={{ "--bond": bond } as CSSProperties} />)}<b>INTERACTION</b></div>
        <div className="hero-material">
          <div className="material-top">
            {surfacePores.map((pore) => <span key={pore} style={{ "--pore": pore } as CSSProperties} />)}
            <div className="material-rim" />
          </div>
          <div className="material-side" /><div className="material-shadow" />
        </div>
        {particles.map((particle) => <span key={particle} className="hero-signal" style={{ "--signal": particle } as CSSProperties} />)}
      </div>
      <div className="hero-prototype-readout"><span><i /> LIVE PROTOTYPE</span><b>FIELD 03</b></div>
      <div className="hero-prototype-axis"><span>Y</span><i /><span>Z</span></div>
    </div>
  );
}
