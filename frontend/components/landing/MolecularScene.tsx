"use client";

import { CSSProperties, useEffect, useRef } from "react";

const particles = [
  [8, 27, 2, 0],
  [17, 12, 3, 1.8],
  [24, 72, 2, 3.3],
  [33, 20, 1, 4.1],
  [42, 78, 3, 2.4],
  [53, 13, 2, 5.2],
  [62, 65, 1, 1.1],
  [72, 26, 2, 3.7],
  [84, 58, 3, 0.8],
  [91, 34, 1, 4.7],
  [76, 82, 2, 2.8],
  [14, 54, 1, 5.8],
] as const;

const nodes = Array.from({ length: 18 }, (_, index) => index);

function styleWithVars(values: Record<string, string | number>): CSSProperties {
  return values as CSSProperties;
}

export default function MolecularScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = scene.getBoundingClientRect();
      pointerRef.current = {
        x: (event.clientX - (bounds.left + bounds.width / 2)) / bounds.width,
        y: (event.clientY - (bounds.top + bounds.height / 2)) / bounds.height,
      };

      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(() => {
          const { x, y } = pointerRef.current;
          scene.style.setProperty("--pointer-x", `${x * 16}px`);
          scene.style.setProperty("--pointer-y", `${y * 12}px`);
          frameRef.current = null;
        });
      }
    };

    const resetPointer = () => {
      scene.style.setProperty("--pointer-x", "0px");
      scene.style.setProperty("--pointer-y", "0px");
    };

    scene.addEventListener("pointermove", handlePointerMove, { passive: true });
    scene.addEventListener("pointerleave", resetPointer);
    return () => {
      scene.removeEventListener("pointermove", handlePointerMove);
      scene.removeEventListener("pointerleave", resetPointer);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      id="interface"
      className="molecular-scene"
      role="img"
      aria-label="Conceptual layered visualization of a protein interacting with a biomaterial surface"
    >
      <div className="scene-ambient scene-ambient-one" />
      <div className="scene-ambient scene-ambient-two" />
      <div className="scene-grid" aria-hidden="true" />

      <div className="scene-particles" aria-hidden="true">
        {particles.map(([left, top, size, delay], index) => (
          <span
            key={index}
            className="scene-particle"
            style={styleWithVars({
              "--particle-left": `${left}%`,
              "--particle-top": `${top}%`,
              "--particle-size": `${size}px`,
              "--particle-delay": `${delay}s`,
            })}
          />
        ))}
      </div>

      <div className="scene-depth-label scene-label-protein">
        <span className="scene-label-line" />
        <span>Protein</span>
        <small>surface recognition</small>
      </div>
      <div className="scene-depth-label scene-label-interface">
        <span className="scene-label-line" />
        <span>Interaction</span>
        <small>molecular interface</small>
      </div>
      <div className="scene-depth-label scene-label-material">
        <span className="scene-label-line" />
        <span>Biomaterial</span>
        <small>conceptual substrate</small>
      </div>

      <div className="scene-orbit orbit-one" aria-hidden="true" />
      <div className="scene-orbit orbit-two" aria-hidden="true" />
      <div className="scene-orbit orbit-three" aria-hidden="true" />

      <div className="protein-system" aria-hidden="true">
        <div className="protein-shadow" />
        <div className="protein-core">
          <div className="protein-ribbon ribbon-one" />
          <div className="protein-ribbon ribbon-two" />
          <div className="protein-ribbon ribbon-three" />
          <div className="protein-nucleus" />
          {nodes.map((node) => (
            <span
              key={node}
              className="protein-node"
              style={styleWithVars({ "--node-index": node })}
            />
          ))}
        </div>
        <div className="binding-points">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="material-surface" aria-hidden="true">
        <div className="material-plane" />
        <div className="material-lines material-lines-one" />
        <div className="material-lines material-lines-two" />
        <div className="material-surface-caption">
          <span className="caption-rule" />
          <span>STRUCTURE  /  03D</span>
        </div>
      </div>

      <div className="scene-coordinate" aria-hidden="true">
        <span>z</span>
        <i />
        <span>x</span>
      </div>
      <div className="scene-index" aria-hidden="true">PMD / 001</div>
    </div>
  );
}

