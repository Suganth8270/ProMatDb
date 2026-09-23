"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import {
  ArrowRight,
  Atom,
  ChevronRight,
  CircleDot,
  Database,
  Dna,
  ExternalLink,
  Layers3,
  Menu,
  Microscope,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { getBiomaterials, getProteins } from "@/services/api";
import MolecularScene from "./MolecularScene";
import ScientificScrollTransition from "./ScientificScrollTransition";

const navItems = ["Features", "Data Sources", "Explore", "About", "Contact"];
type ScienceFocus = "neutral" | "protein" | "material" | "binding";

const featureCards = [
  { icon: Dna, tone: "ivory", eyebrow: "01 / BIOLOGY", title: "Explore Proteins", copy: "Search and browse protein records with sequence, structure, and biological context.", href: "/proteins" },
  { icon: Layers3, tone: "blue", eyebrow: "02 / MATERIALS", title: "Explore Biomaterials", copy: "Discover natural and synthetic materials with properties shaped for research.", href: "/biomaterials" },
  { icon: CircleDot, tone: "lavender", eyebrow: "03 / INTERACTION", title: "Analyze Interactions", copy: "Study protein–biomaterial relationships and the evidence behind each record.", href: "/interactions" },
  { icon: Microscope, tone: "ivory", eyebrow: "04 / VISUALIZATION", title: "See It in 3D", copy: "Move from molecular structure to a more intuitive understanding of form.", href: "/workspace" },
];

function handleFeatureCardGlow(event: MouseEvent<HTMLAnchorElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

const FEATURES_HEADING = "Research becomes clearer when the pieces connect.";
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SCRAMBLE_DURATION_MS = 1600;

function randomScrambleChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const journey = [
  {
    number: "01",
    title: "Protein",
    tagline: "Sequence + structure",
    icon: Dna,
    eyebrow: "01 / PROTEIN",
    headline: "From sequence to structure",
    description: "Search and explore protein records with sequence, structure, and biological context.",
    bullets: ["Sequence data", "3D structure", "Biological context"],
    cta: { label: "Explore Proteins", href: "/proteins" },
  },
  {
    number: "02",
    title: "Biomaterial",
    tagline: "Properties + context",
    icon: Layers3,
    eyebrow: "02 / BIOMATERIAL",
    headline: "Properties + context",
    description: "Natural and synthetic biomaterials with properties and research context.",
  },
  {
    number: "03",
    title: "Interaction",
    tagline: "Molecular interface",
    icon: CircleDot,
    eyebrow: "03 / INTERACTION",
    headline: "Molecular interface",
    description: "Explore protein–biomaterial relationships and interaction evidence.",
  },
  {
    number: "04",
    title: "Docking",
    tagline: "Computed insight",
    icon: Database,
    eyebrow: "04 / DOCKING",
    headline: "Computed insight",
    description: "Understand docking results, binding poses, and interaction evidence.",
  },
  {
    number: "05",
    title: "3D Analysis",
    tagline: "Spatial understanding",
    icon: Microscope,
    eyebrow: "05 / 3D ANALYSIS",
    headline: "Spatial understanding",
    description: "Explore molecular structures and interaction geometry in three dimensions.",
  },
  {
    number: "06",
    title: "Research Insight",
    tagline: "A clearer next step",
    icon: Sparkles,
    eyebrow: "06 / RESEARCH INSIGHT",
    headline: "A clearer next step",
    description: "Connect the evidence into a more meaningful research direction.",
  },
] as const;

const sources = [
  ["UniProt", "Protein sequence and biological information.", "EXTERNAL DATA", "green"],
  ["PDB", "Protein structural information.", "EXTERNAL DATA", "blue"],
  ["PubChem", "Chemical and compound information.", "EXTERNAL DATA", "amber"],
  ["AutoDock Vina", "Computed docking results.", "COMPUTED RESULTS", "charcoal"],
];

type Metric = { label: string; value: number | null; suffix?: string };

function CountMetric({ metric }: { metric: Metric }) {
  return (
    <div className="landing-metric">
      <strong>{metric.value === null ? "—" : metric.value.toLocaleString()}{metric.suffix}</strong>
      <span>{metric.label}</span>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLElement | null>(null);
  const [featuresHeadingText, setFeaturesHeadingText] = useState(FEATURES_HEADING);
  const scrambleFrameRef = useRef<number | null>(null);
  const scrambleStartRef = useRef<number | null>(null);
  const isScramblingRef = useRef(false);
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "Proteins", value: null },
    { label: "Biomaterials", value: null },
    { label: "Interactions", value: null },
    { label: "Imported today", value: null },
  ]);
  const [journeyActive, setJourneyActive] = useState(0);
  const [scienceFocus, setScienceFocus] = useState<ScienceFocus>("neutral");
  const journeyManualRef = useRef(false);
  const journeyLineRef = useRef<HTMLDivElement | null>(null);
  const scienceHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const scienceScanFrameRef = useRef<number | null>(null);
  const scienceScanTargetRef = useRef({ x: 50, opacity: 0 });
  const scienceScanCurrentRef = useRef({ x: 50, opacity: 0 });
  const scienceScanTrailRef = useRef(50);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const node = featuresRef.current;
    if (!node) return;

    // Once the section has entered the viewport, keep the reveal applied —
    // no need to reset the animation every time it scrolls out again.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFeaturesVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (scrambleFrameRef.current !== null) {
        cancelAnimationFrame(scrambleFrameRef.current);
      }
      if (scienceScanFrameRef.current !== null) {
        cancelAnimationFrame(scienceScanFrameRef.current);
      }
    };
  }, []);

  const scheduleScienceScan = (x: number, opacity: number) => {
    const node = scienceHeadingRef.current;
    if (!node || prefersReducedMotion()) return;
    scienceScanTargetRef.current = { x, opacity };
    if (scienceScanFrameRef.current !== null) return;

    const settle = () => {
      const target = scienceScanTargetRef.current;
      const current = scienceScanCurrentRef.current;
      scienceScanTrailRef.current = current.x - (target.x - current.x) * 0.18;
      current.x += (target.x - current.x) * 0.18;
      current.opacity += (target.opacity - current.opacity) * 0.2;
      node.style.setProperty("--science-scan-x", `${current.x}%`);
      node.style.setProperty("--science-scan-trail-x", `${scienceScanTrailRef.current}%`);
      node.style.setProperty("--science-scan-opacity", `${current.opacity}`);

      const positionSettled = Math.abs(target.x - current.x) < 0.12;
      const opacitySettled = Math.abs(target.opacity - current.opacity) < 0.015;
      if (positionSettled && opacitySettled) {
        current.x = target.x;
        current.opacity = target.opacity;
        scienceScanTrailRef.current = current.x;
        node.style.setProperty("--science-scan-x", `${current.x}%`);
        node.style.setProperty("--science-scan-trail-x", `${scienceScanTrailRef.current}%`);
        node.style.setProperty("--science-scan-opacity", `${current.opacity}`);
        scienceScanFrameRef.current = null;
        return;
      }

      scienceScanFrameRef.current = requestAnimationFrame(settle);
    };

    scienceScanFrameRef.current = requestAnimationFrame(settle);
  };

  const handleScienceHeadingMove = (event: PointerEvent<HTMLHeadingElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    scheduleScienceScan(x, 1);
  };

  const handleScienceHeadingLeave = () => {
    scheduleScienceScan(scienceScanTargetRef.current.x, 0);
  };

  const handleSciencePointLeave = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") setScienceFocus("neutral");
  };

  const handleFeaturesHeadingEnter = () => {
    if (isScramblingRef.current || prefersReducedMotion()) return;
    isScramblingRef.current = true;
    scrambleStartRef.current = null;

    const chars = FEATURES_HEADING.split("");
    const scrambleIndices = chars.reduce<number[]>((acc, char, i) => {
      if (/[A-Za-z0-9]/.test(char)) acc.push(i);
      return acc;
    }, []);
    const totalScramble = scrambleIndices.length;

    const step = (timestamp: number) => {
      if (scrambleStartRef.current === null) scrambleStartRef.current = timestamp;
      const elapsed = timestamp - scrambleStartRef.current;
      const progress = Math.min(elapsed / SCRAMBLE_DURATION_MS, 1);
      const resolvedCount = Math.floor(progress * totalScramble);

      const next = chars
        .map((char, i) => {
          if (!/[A-Za-z0-9]/.test(char)) return char; // spaces & punctuation stay fixed
          const orderIndex = scrambleIndices.indexOf(i);
          return orderIndex < resolvedCount ? char : randomScrambleChar();
        })
        .join("");

      setFeaturesHeadingText(next);

      if (progress < 1) {
        scrambleFrameRef.current = requestAnimationFrame(step);
      } else {
        setFeaturesHeadingText(FEATURES_HEADING);
        isScramblingRef.current = false;
        scrambleFrameRef.current = null;
        scrambleStartRef.current = null;
      }
    };

    scrambleFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    let active = true;
    Promise.allSettled([getProteins(), getBiomaterials()]).then(([proteins, materials]) => {
      if (!active) return;
      setMetrics([
        { label: "Proteins", value: proteins.status === "fulfilled" ? proteins.value.length : null },
        { label: "Biomaterials", value: materials.status === "fulfilled" ? materials.value.length : null },
        { label: "Interactions", value: null },
        { label: "Imported today", value: null },
      ]);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const track = journeyLineRef.current;
    if (!track || prefersReducedMotion()) return;

    // Drives the active journey stage from scroll position. A click/focus
    // selection pins the stage temporarily, but any further scrolling hands
    // control back to scroll-driven activation immediately — hovering never
    // pins it, so the journey can't get permanently stuck.
    let frame: number | null = null;
    const evaluate = () => {
      frame = null;
      if (journeyManualRef.current) return;
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const start = vh * 0.82;
      const end = vh * 0.22;
      const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
      const index = Math.min(journey.length - 1, Math.floor(progress * journey.length));
      setJourneyActive((prev) => (prev === index ? prev : index));
    };
    const onScroll = () => {
      journeyManualRef.current = false;
      if (frame === null) frame = requestAnimationFrame(evaluate);
    };
    const onResize = () => {
      if (frame === null) frame = requestAnimationFrame(evaluate);
    };

    evaluate();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  const selectJourneyStage = (index: number) => {
    journeyManualRef.current = true;
    setJourneyActive(index);
  };

  const previewJourneyStage = (index: number) => {
    // Hover only nudges the active stage for the moment — it never pins
    // scroll-driven activation off, so scrolling stays in control.
    setJourneyActive(index);
  };

  return (
    <main className="landing-page">
      <header className={`landing-header ${scrolled ? "is-scrolled" : ""}`}>
        <Link href="/" className="landing-wordmark" aria-label="ProMatDB home">
          <span className="brand-glyph" aria-hidden="true"><i /><i /><i /><i /></span>
          <span><b>ProMatDB</b><small>PROTEIN–BIOMATERIAL INTERACTION DATABASE</small></span>
        </Link>
        <nav className="landing-desktop-nav" aria-label="Landing navigation">
          <a className="is-active" href="#top">Home</a>
          {navItems.map((item) => <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}>{item}</a>)}
        </nav>
        <div className="landing-header-actions">
          <Link href="/login" className="landing-signin">Sign In</Link>
          <Link href="/workspace" className="landing-workspace">Open Workspace <ArrowRight size={15} /></Link>
        </div>
        <button className="landing-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        {menuOpen && <div className="landing-mobile-nav">{["Home", ...navItems].map((item) => <a key={item} href={item === "Home" ? "#top" : `#${item.toLowerCase().replace(" ", "-")}`} onClick={() => setMenuOpen(false)}>{item}<ChevronRight size={15} /></a>)}<div><Link href="/login" onClick={() => setMenuOpen(false)}>Sign In</Link><Link href="/workspace" className="landing-workspace" onClick={() => setMenuOpen(false)}>Open Workspace <ArrowRight size={15} /></Link></div></div>}
      </header>

      <section id="top" className="landing-hero-new">
        <div className="hero-atmosphere" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="hero-editorial-grid" aria-hidden="true" />
        <div className="hero-copy-new">
          <div className="landing-kicker"><span /> SCIENCE MEETS MATERIALS</div>
          <h1>Connecting <em className="ink">Proteins</em> and <em className="blue">Biomaterials</em> <span>for a Better Tomorrow</span></h1>
          <p className="hero-lede">ProMatDB is a next-generation platform for exploring protein–biomaterial interactions, enabling research in binding behavior, biocompatibility, and molecular structure data.</p>
          <div className="hero-actions-new"><a href="#explore" className="button-dark">Explore interactions <ArrowRight size={17} /></a><a href="#science" className="button-light"><Play size={14} fill="currentColor" /> Watch the science</a></div>
          <div className="hero-metrics"><CountMetric metric={metrics[0]} /><CountMetric metric={metrics[1]} /><CountMetric metric={metrics[2]} /><CountMetric metric={metrics[3]} /></div>
        </div>
        <div className="hero-scene-new"><MolecularScene /><div className="scene-caption scene-caption-protein"><b>PROTEIN</b><span>Structure · Function<br />Interaction</span></div><div className="scene-caption scene-caption-material"><b>BIOMATERIAL</b><span>Properties · Compatibility<br />Design</span></div><div className="scene-caption scene-caption-interface"><b>INTERACTION</b><span>Binding interface · Active field</span></div></div>
      </section>

      <ScientificScrollTransition />

      <section id="features" ref={featuresRef} className={`landing-section features-section section-reveal ${featuresVisible ? "is-visible" : ""}`}><div className="section-intro"><div className="landing-kicker"><span /> ONE PLATFORM, MANY LENSES</div><h2 className="scramble-heading" onPointerEnter={handleFeaturesHeadingEnter}><span aria-hidden="true">{featuresHeadingText}</span><span className="visually-hidden">{FEATURES_HEADING}</span></h2><p>Move fluently between biology, materials, interactions, and the visual language of molecular structure.</p></div><div className="feature-grid">{featureCards.map(({ icon: Icon, tone, eyebrow, title, copy, href }) => <Link href={href} key={title} className="feature-card" onMouseMove={handleFeatureCardGlow}><div className={`feature-icon ${tone}`}><Icon size={20} strokeWidth={1.5} /></div><small>{eyebrow}</small><h3>{title}</h3><p>{copy}</p><ArrowRight className="feature-arrow" size={19} /></Link>)}</div></section>

      <section id="explore" className="landing-section journey-section section-reveal">
        <div className="section-intro centered"><div className="landing-kicker"><span /> THE PROMATDB JOURNEY</div><h2>From Data to Discovery</h2><p>One connected path from the first sequence to a more meaningful research insight.</p></div>
        <div className="journey-line" ref={journeyLineRef}>
          {journey.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = journeyActive === index;
            return (
              <div
                className={`journey-step ${isActive ? "is-active" : ""}`}
                key={stage.number}
                onMouseEnter={() => previewJourneyStage(index)}
              >
                <button
                  type="button"
                  className="journey-step-trigger"
                  onClick={() => selectJourneyStage(index)}
                  onFocus={() => selectJourneyStage(index)}
                  aria-expanded={isActive}
                  aria-controls={`journey-panel-${stage.number}`}
                >
                  <span className="journey-node"><Icon size={16} strokeWidth={1.6} /></span>
                  <small>{stage.number}</small>
                  <h3>{stage.title}</h3>
                  <p>{stage.tagline}</p>
                </button>
                <span className="journey-stem" aria-hidden="true" />
                <div className="journey-panel" id={`journey-panel-${stage.number}`} role="region" aria-hidden={!isActive}>
                  <div className="journey-panel-inner">
                    <span className="journey-panel-eyebrow"><Icon size={12} strokeWidth={1.6} />{stage.eyebrow}</span>
                    <h4>{stage.headline}</h4>
                    <p>{stage.description}</p>
                    {"bullets" in stage && stage.bullets && (
                      <ul className="journey-panel-bullets">
                        {stage.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    )}
                    {"cta" in stage && stage.cta && (
                      <Link href={stage.cta.href} className="journey-panel-cta">{stage.cta.label} <ArrowRight size={13} /></Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="science" className="science-showcase section-reveal"><div className="showcase-copy"><div className="landing-kicker light"><span /> A CLOSER LOOK</div><h2 ref={scienceHeadingRef} className="science-scan-heading" data-scan-text="See the science in three dimensions." onPointerMove={handleScienceHeadingMove} onPointerLeave={handleScienceHeadingLeave}>See the science in three dimensions.</h2><p>Scientific understanding is spatial. Explore the relationships between structure, surface, and interaction through a visual language built for discovery.</p><div className="showcase-notes"><span><Atom size={16} /> Conceptual molecular interface</span><span><Sparkles size={16} /> Interactive visualization layer</span></div><Link href="/workspace" className="button-cream">Open the workspace <ArrowRight size={16} /></Link></div><div className="showcase-visual"><MolecularScene compact focus={scienceFocus} /><div className="showcase-data" aria-label="Molecular visualization focus points"><button type="button" className={`science-focus-point ${scienceFocus === "protein" ? "is-active" : ""}`} aria-pressed={scienceFocus === "protein"} onPointerEnter={() => setScienceFocus("protein")} onPointerDown={(event) => { if (event.pointerType === "touch") setScienceFocus("protein"); }} onPointerLeave={handleSciencePointLeave} onFocus={() => setScienceFocus("protein")} onBlur={() => setScienceFocus("neutral")}><b>01</b><span>PROTEIN SURFACE</span><small>Structure</small></button><button type="button" className={`science-focus-point ${scienceFocus === "material" ? "is-active" : ""}`} aria-pressed={scienceFocus === "material"} onPointerEnter={() => setScienceFocus("material")} onPointerDown={(event) => { if (event.pointerType === "touch") setScienceFocus("material"); }} onPointerLeave={handleSciencePointLeave} onFocus={() => setScienceFocus("material")} onBlur={() => setScienceFocus("neutral")}><b>02</b><span>MATERIAL INTERFACE</span><small>Surface</small></button><button type="button" className={`science-focus-point ${scienceFocus === "binding" ? "is-active" : ""}`} aria-pressed={scienceFocus === "binding"} onPointerEnter={() => setScienceFocus("binding")} onPointerDown={(event) => { if (event.pointerType === "touch") setScienceFocus("binding"); }} onPointerLeave={handleSciencePointLeave} onFocus={() => setScienceFocus("binding")} onBlur={() => setScienceFocus("neutral")}><b>03</b><span>BINDING ZONE</span><small>Interaction</small></button></div></div></section>

      <section id="data-sources" className="landing-section sources-section section-reveal"><div className="section-intro"><div className="landing-kicker"><span /> SCIENTIFIC FOUNDATION</div><h2>Built on scientific data.</h2><p>ProMatDB brings together trusted external sources, user-imported records, and computed results in one research context.</p></div><div className="source-grid">{sources.map(([name, copy, tag, tone]) => <div className={`source-card ${tone}`} key={name}><div className="source-top"><Database size={19} /><small>{tag}</small></div><h3>{name}</h3><p>{copy}</p><ExternalLink size={15} /></div>)}</div></section>

      <section className="snapshot-section section-reveal"><div className="snapshot-inner"><div><div className="landing-kicker light"><span /> PLATFORM SNAPSHOT</div><h2>A living research landscape.</h2><p>Safe public counts appear as the platform makes them available. No invented measurements, no black-box claims.</p></div><div className="snapshot-metrics">{metrics.map((metric) => <CountMetric metric={metric} key={metric.label} />)}</div></div></section>

      <section id="about" className="mission-section section-reveal"><div className="mission-curve" aria-hidden="true" /><div className="mission-copy"><div className="landing-kicker light"><span /> OUR MISSION</div><h2>Building Bridges Between <em>Biology</em>, <em className="blue">Materials</em> and Innovation</h2><p>We aim to provide a unified, reliable, and open platform for researchers to explore how proteins interact with biomaterials, accelerating discoveries in healthcare, biotechnology, and sustainable materials.</p></div><div className="mission-note">Research for a<br /><i>Healthier</i> and<br /><i>Sustainable World</i><span>✦</span></div></section>

      <section className="final-cta-section section-reveal"><div className="final-cta-mark"><Atom size={26} /></div><div><div className="landing-kicker light"><span /> YOUR NEXT QUESTION STARTS HERE</div><h2>Explore the molecular interface.</h2><p>Discover proteins, biomaterials, interactions, and molecular structures through one unified research platform.</p></div><div className="final-cta-actions"><Link href="/workspace" className="button-cream">Open Workspace <ArrowRight size={16} /></Link><Link href="#features" className="button-outline-light">Explore ProMatDB</Link></div></section>

      <footer id="contact" className="landing-footer-new"><div className="footer-brand"><Link href="/" className="landing-wordmark"><span className="brand-glyph" aria-hidden="true"><i /><i /><i /><i /></span><span><b>ProMatDB</b><small>PROTEIN–BIOMATERIAL INTERACTION DATABASE</small></span></Link><p>Making molecular interfaces<br />a little more understandable.</p></div><div><small className="footer-heading">Navigate</small><a href="#top">Home</a><a href="#features">Features</a><a href="#data-sources">Data Sources</a><a href="#explore">Explore</a><a href="#about">About</a></div><div><small className="footer-heading">Platform</small><Link href="/proteins">Proteins</Link><Link href="/biomaterials">Biomaterials</Link><Link href="/interactions">Interactions</Link><Link href="/docking">Docking</Link><Link href="/workspace">3D Visualization</Link></div><div><small className="footer-heading">Access</small><Link href="/login">Sign In</Link><Link href="/workspace">Open Workspace</Link><span className="footer-email">hello@promatdb.org</span></div><div className="footer-bottom"><span>© 2026 ProMatDB. A research interface for protein–biomaterial discovery.</span><span>DISCOVER · ANALYZE · VISUALIZE · INNOVATE</span></div></footer>
    </main>
  );
}
