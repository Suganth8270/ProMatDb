"use client";

import { useEffect, useRef } from "react";

const ASSETS = [
  { label: "01 / DNA", title: "GENETIC INFORMATION", src: "/landing/bio-assets/dna-01.png" },
  { label: "02 / TRANSCRIPTION", title: "DNA → RNA", src: "/landing/bio-assets/transcription-02.png" },
  { label: "03 / mRNA", title: "MESSENGER RNA", src: "/landing/bio-assets/rna-03.png" },
  { label: "04 / TRANSLATION", title: "PROTEIN SYNTHESIS", src: "/landing/bio-assets/translation-04.png" },
  { label: "05 / PROTEIN", title: "FUNCTIONAL MOLECULE", src: "/landing/bio-assets/protein-05.png" },
];

const STAGE_STARTS = [0, 0.18, 0.38, 0.58, 0.78];
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export default function BiotechParallaxSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageMetaRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stageMeta = stageMetaRef.current;
    if (!section || !stageMeta) return;

    const stages = Array.from(section.querySelectorAll<HTMLImageElement>("[data-biotech-stage]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const preloaders = ASSETS.map(({ src, label }) => {
      const image = new window.Image();
      image.onload = () => console.debug(`[BiotechParallaxSection] loaded ${label}: ${src}`);
      image.onerror = () => console.error(`[BiotechParallaxSection] failed to load ${label}: ${src}`);
      image.src = src;
      return image;
    });

    const updateMeta = (index: number) => {
      stageMeta.querySelector("span")!.textContent = ASSETS[index].label;
      stageMeta.querySelector("b")!.textContent = ASSETS[index].title;
    };

    const update = () => {
      frameRef.current = null;
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = reduced ? 0 : clamp(-section.getBoundingClientRect().top / travel);
      let current = 0;
      for (let index = STAGE_STARTS.length - 1; index > 0; index -= 1) {
        if (progress >= STAGE_STARTS[index]) {
          current = index;
          break;
        }
      }

      const next = Math.min(current + 1, ASSETS.length - 1);
      const stageEnd = current === ASSETS.length - 1 ? 1 : STAGE_STARTS[next];
      const stageLength = Math.max(0.01, stageEnd - STAGE_STARTS[current]);
      const local = current === ASSETS.length - 1 ? 1 : clamp((progress - STAGE_STARTS[current]) / stageLength);
      const transitionStart = current === ASSETS.length - 1 ? 1 : 0.8;
      const cross = current === ASSETS.length - 1 ? 0 : clamp((local - transitionStart) / (1 - transitionStart));
      updateMeta(cross > 0.5 ? next : current);

      stages.forEach((stage, index) => {
        let opacity = 0;
        let scale = 0.92;
        let x = 0;
        let y = 0;
        if (index === current) {
          opacity = 1 - cross;
          scale = 1 - cross * 0.08;
          x = -cross * 3;
          y = -cross * 3;
        } else if (index === next && cross > 0) {
          opacity = cross;
          scale = 0.92 + cross * 0.08;
          x = (1 - cross) * 3;
          y = (1 - cross) * 3;
        }
        stage.style.opacity = `${Math.max(0, opacity)}`;
        stage.style.transform = `translate3d(calc(-50% + ${x}vw), calc(-50% + ${y}vh), 0) scale(${scale})`;
      });
    };

    const requestUpdate = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      preloaders.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <section ref={sectionRef} className="biotech-parallax" aria-label="DNA to protein biotechnology journey">
      <div className="biotech-parallax__viewport">
        <div className="biotech-parallax__paper" aria-hidden="true" />
        <div className="biotech-parallax__visual-stage" aria-label="Biotechnology process visualization">
          {ASSETS.map((asset) => (
            <img
              key={asset.src}
              data-biotech-stage
              className="biotech-parallax__asset"
              src={asset.src}
              alt={`${asset.label}: ${asset.title}`}
              loading="eager"
              decoding="async"
              onError={(event) => console.error(`[BiotechParallaxSection] image error: ${asset.src}`, event.currentTarget)}
            />
          ))}
        </div>
        <div className="biotech-parallax__intro"><span className="biotech-parallax__eyebrow">BIOTECHNOLOGY / LIVING SYSTEMS</span><h2>Life,<br />Reimagined.</h2><p>Exploring living systems, biological materials, and the technologies that shape what comes next.</p></div>
        <div ref={stageMetaRef} className="biotech-parallax__stage-meta" aria-live="polite"><span>01 / DNA</span><b>GENETIC INFORMATION</b></div>
      </div>
    </section>
  );
}
