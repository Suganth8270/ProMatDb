"use client";

import { useEffect, useRef, useState } from "react";

const words = [
  {
    text: "PROTEIN",
    sub: "Sequence becomes structure.",
    video: "/landing/scenes/01-PROTEIN.mp4",
  },
  {
    text: "INTERACTION",
    sub: "Structure meets a surface.",
    video: "/landing/scenes/02-INTERACTION.mp4",
  },
  {
    text: "BIOMATERIAL",
    sub: "Surface becomes context.",
    video: "/landing/scenes/03-BIOMATERIAL.mp4",
  },
  {
    text: "DISCOVERY",
    sub: "Structure becomes a question worth asking.",
    video: "/landing/scenes/04-DISCOVERY.mp4",
  },
] as const;

const SLICE = 1 / words.length;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getProgress(section: HTMLElement) {
  const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
  return clamp01(-section.getBoundingClientRect().top / travel);
}

function getActiveScene(progress: number) {
  return Math.min(words.length - 1, Math.floor(progress * words.length));
}

function editorialOpacity(localProgress: number) {
  // One title at a time: enter, hold, exit, then a short quiet gap.
  const ENTER = 0.12;
  const HOLD_END = 0.62;
  const EXIT_END = 0.84;

  if (localProgress <= ENTER) return clamp01(localProgress / ENTER);
  if (localProgress <= HOLD_END) return 1;
  if (localProgress <= EXIT_END) {
    return clamp01(1 - (localProgress - HOLD_END) / (EXIT_END - HOLD_END));
  }
  return 0;
}

export default function ScientificScrollTransition() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setReducedMotion(media.matches);
    syncReducedMotion();
    media.addEventListener("change", syncReducedMotion);

    let frame = 0;
    const update = () => {
      const section = sectionRef.current;
      if (section) setProgress(getProgress(section));
      frame = 0;
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      media.removeEventListener("change", syncReducedMotion);
    };
  }, []);

  const sceneProgress = reducedMotion ? 0.999 : progress;
  const activeScene = reducedMotion ? words.length - 1 : getActiveScene(sceneProgress);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeScene && !reducedMotion) {
        // Let the browser manage buffering; do not seek or call load() on scroll.
        const playPromise = video.play();
        if (playPromise) playPromise.catch(() => undefined);
      } else {
        video.pause();
      }
    });
  }, [activeScene, reducedMotion]);

  const scenes = words.map((_, index) => {
    const start = index * SLICE;
    const local = clamp01((sceneProgress - start) / SLICE);
    const opacity = index === activeScene ? editorialOpacity(local) : 0;
    const reveal = clamp01(local / 0.12);
    return { opacity, reveal };
  });

  return (
    <section
      ref={sectionRef}
      className="science-timeline"
      aria-label="Discovery: protein interaction with a biomaterial surface"
    >
      <div className="science-timeline__pin">
        <div className="science-timeline__wash" aria-hidden="true" />

        <div className="science-timeline__text">
          <svg
            className="science-timeline__svg"
            viewBox="0 0 700 280"
            role="img"
            aria-label={words[activeScene].text}
          >
            <defs>
              {words.map((_, index) => (
                <mask id={`wordMask-${index}`} key={`mask-${index}`} maskUnits="userSpaceOnUse">
                  <rect width="700" height="280" fill="black" />
                  <rect
                    x="0"
                    y="92"
                    width={700 * scenes[index].reveal}
                    height="170"
                    fill="white"
                  />
                </mask>
              ))}
            </defs>

            {words.map((word, index) => (
              <g
                key={word.text}
                className="science-timeline__editorial"
                mask={`url(#wordMask-${index})`}
                style={{
                  opacity: scenes[index].opacity,
                  transform: `translateY(${(1 - scenes[index].reveal) * 14}px)`,
                }}
              >
                <text x="4" y="190">{word.text}</text>
                <text x="6" y="232">{word.sub}</text>
              </g>
            ))}
          </svg>
        </div>

        <div className="science-timeline__visual">
          <div className="science-timeline__video-frame">
            <div className="science-timeline__video-layer" aria-hidden="true">
              {words.map((word, index) => (
                <video
                  key={word.text}
                  ref={(element) => {
                    videoRefs.current[index] = element;
                  }}
                  className={`science-timeline__video ${
                    index === activeScene ? "is-active" : ""
                  } ${index === 3 ? "science-timeline__video--discovery" : ""}`}
                  src={word.video}
                  muted
                  playsInline
                  loop
                  preload="auto"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="science-timeline__meter" aria-hidden="true">
          <span style={{ width: `${Math.max(6, sceneProgress * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}
