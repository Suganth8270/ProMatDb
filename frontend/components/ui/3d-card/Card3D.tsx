"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./card-3d.css";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Accent used for the pointer-follow sheen and hover glow.
   * Maps to existing ProMatDB tokens — no new colors introduced.
   */
  glow?: "primary" | "secondary" | "indigo" | "violet";
}

/** Max tilt in degrees at full desktop intensity. Kept subtle per spec. */
const MAX_TILT = 8;

export default function Card3D({
  children,
  className = "",
  glow = "primary",
}: Card3DProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  const [canHover, setCanHover] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tiltScale, setTiltScale] = useState(1);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    const syncHover = () => setCanHover(hoverQuery.matches);
    const syncMotion = () => setReducedMotion(motionQuery.matches);
    // Desktop = full tilt. Tablet-with-hover (trackpad/stylus) = reduced tilt.
    const syncScale = () => setTiltScale(desktopQuery.matches ? 1 : 0.5);

    syncHover();
    syncMotion();
    syncScale();

    hoverQuery.addEventListener("change", syncHover);
    motionQuery.addEventListener("change", syncMotion);
    desktopQuery.addEventListener("change", syncScale);

    return () => {
      hoverQuery.removeEventListener("change", syncHover);
      motionQuery.removeEventListener("change", syncMotion);
      desktopQuery.removeEventListener("change", syncScale);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !canHover) return;
      const el = rootRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;

      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const rotateY = (px - 0.5) * MAX_TILT * 2 * tiltScale;
        const rotateX = (0.5 - py) * MAX_TILT * 2 * tiltScale;
        el.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
        el.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
        el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      });
    },
    [reducedMotion, canHover, tiltScale]
  );

  const handleMouseLeave = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "50%");
  }, []);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`card3d card3d--${glow} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card3d__inner">
        <div className="card3d__sheen" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}