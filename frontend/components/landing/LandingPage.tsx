"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

const featureCards = [
  { icon: Dna, tone: "green", eyebrow: "01 / BIOLOGY", title: "Explore Proteins", copy: "Search and browse protein records with sequence, structure, and biological context.", href: "/proteins" },
  { icon: Layers3, tone: "blue", eyebrow: "02 / MATERIALS", title: "Explore Biomaterials", copy: "Discover natural and synthetic materials with properties shaped for research.", href: "/biomaterials" },
  { icon: CircleDot, tone: "lavender", eyebrow: "03 / INTERACTION", title: "Analyze Interactions", copy: "Study protein–biomaterial relationships and the evidence behind each record.", href: "/interactions" },
  { icon: Microscope, tone: "amber", eyebrow: "04 / VISUALIZATION", title: "3D Visualization", copy: "Move from molecular structure to a more intuitive understanding of form.", href: "/workspace" },
];

const journey = [
  ["01", "Protein", "Sequence + structure"],
  ["02", "Biomaterial", "Properties + context"],
  ["03", "Interaction", "Molecular interface"],
  ["04", "Docking", "Computed insight"],
  ["05", "3D Analysis", "Spatial understanding"],
  ["06", "Research Insight", "A clearer next step"],
];

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
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "Proteins", value: null },
    { label: "Biomaterials", value: null },
    { label: "Interactions", value: null },
    { label: "Imported today", value: null },
  ]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

      <section id="features" className="landing-section features-section section-reveal"><div className="section-intro"><div className="landing-kicker"><span /> ONE PLATFORM, MANY LENSES</div><h2>Research becomes clearer when the pieces connect.</h2><p>Move fluently between biology, materials, interactions, and the visual language of molecular structure.</p></div><div className="feature-grid">{featureCards.map(({ icon: Icon, tone, eyebrow, title, copy, href }) => <Link href={href} key={title} className="feature-card"><div className={`feature-icon ${tone}`}><Icon size={20} strokeWidth={1.5} /></div><small>{eyebrow}</small><h3>{title}</h3><p>{copy}</p><ArrowRight className="feature-arrow" size={19} /></Link>)}</div></section>

      <section id="explore" className="landing-section journey-section section-reveal"><div className="section-intro centered"><div className="landing-kicker"><span /> THE PROMATDB JOURNEY</div><h2>From Data to Discovery</h2><p>One connected path from the first sequence to a more meaningful research insight.</p></div><div className="journey-line">{journey.map(([number, title, copy], index) => <div className="journey-step" key={number}><div className="journey-node">{index === 0 ? <Dna size={17} /> : number}</div><small>{number}</small><h3>{title}</h3><p>{copy}</p></div>)}</div></section>

      <section id="science" className="science-showcase section-reveal"><div className="showcase-copy"><div className="landing-kicker light"><span /> A CLOSER LOOK</div><h2>See the science in three dimensions.</h2><p>Scientific understanding is spatial. Explore the relationships between structure, surface, and interaction through a visual language built for discovery.</p><div className="showcase-notes"><span><Atom size={16} /> Conceptual molecular interface</span><span><Sparkles size={16} /> Interactive visualization layer</span></div><Link href="/workspace" className="button-cream">Open the workspace <ArrowRight size={16} /></Link></div><div className="showcase-visual"><MolecularScene compact /><div className="showcase-data"><span><b>01</b> PROTEIN SURFACE</span><span><b>02</b> MATERIAL INTERFACE</span><span><b>03</b> BINDING ZONE</span></div></div></section>

      <section id="data-sources" className="landing-section sources-section section-reveal"><div className="section-intro"><div className="landing-kicker"><span /> SCIENTIFIC FOUNDATION</div><h2>Built on scientific data.</h2><p>ProMatDB brings together trusted external sources, user-imported records, and computed results in one research context.</p></div><div className="source-grid">{sources.map(([name, copy, tag, tone]) => <div className={`source-card ${tone}`} key={name}><div className="source-top"><Database size={19} /><small>{tag}</small></div><h3>{name}</h3><p>{copy}</p><ExternalLink size={15} /></div>)}</div></section>

      <section className="snapshot-section section-reveal"><div className="snapshot-inner"><div><div className="landing-kicker light"><span /> PLATFORM SNAPSHOT</div><h2>A living research landscape.</h2><p>Safe public counts appear as the platform makes them available. No invented measurements, no black-box claims.</p></div><div className="snapshot-metrics">{metrics.map((metric) => <CountMetric metric={metric} key={metric.label} />)}</div></div></section>

      <section id="about" className="mission-section section-reveal"><div className="mission-curve" aria-hidden="true" /><div className="mission-copy"><div className="landing-kicker light"><span /> OUR MISSION</div><h2>Building Bridges Between <em>Biology</em>, <em className="blue">Materials</em> and Innovation</h2><p>We aim to provide a unified, reliable, and open platform for researchers to explore how proteins interact with biomaterials, accelerating discoveries in healthcare, biotechnology, and sustainable materials.</p></div><div className="mission-note">Research for a<br /><i>Healthier</i> and<br /><i>Sustainable World</i><span>✦</span></div></section>

      <section className="final-cta-section section-reveal"><div className="final-cta-mark"><Atom size={26} /></div><div><div className="landing-kicker light"><span /> YOUR NEXT QUESTION STARTS HERE</div><h2>Explore the molecular interface.</h2><p>Discover proteins, biomaterials, interactions, and molecular structures through one unified research platform.</p></div><div className="final-cta-actions"><Link href="/workspace" className="button-cream">Open Workspace <ArrowRight size={16} /></Link><Link href="#features" className="button-outline-light">Explore ProMatDB</Link></div></section>

      <footer id="contact" className="landing-footer-new"><div className="footer-brand"><Link href="/" className="landing-wordmark"><span className="brand-glyph" aria-hidden="true"><i /><i /><i /><i /></span><span><b>ProMatDB</b><small>PROTEIN–BIOMATERIAL INTERACTION DATABASE</small></span></Link><p>Making molecular interfaces<br />a little more understandable.</p></div><div><small className="footer-heading">Navigate</small><a href="#top">Home</a><a href="#features">Features</a><a href="#data-sources">Data Sources</a><a href="#explore">Explore</a><a href="#about">About</a></div><div><small className="footer-heading">Platform</small><Link href="/proteins">Proteins</Link><Link href="/biomaterials">Biomaterials</Link><Link href="/interactions">Interactions</Link><Link href="/docking">Docking</Link><Link href="/workspace">3D Visualization</Link></div><div><small className="footer-heading">Access</small><Link href="/login">Sign In</Link><Link href="/workspace">Open Workspace</Link><span className="footer-email">hello@promatdb.org</span></div><div className="footer-bottom"><span>© 2026 ProMatDB. A research interface for protein–biomaterial discovery.</span><span>DISCOVER · ANALYZE · VISUALIZE · INNOVATE</span></div></footer>
    </main>
  );
}
