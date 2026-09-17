import Link from "next/link";
import { ArrowUpRight, ChevronDown, ScanLine } from "lucide-react";
import MolecularScene from "@/components/landing/MolecularScene";

export default function LandingHero() {
  return (
    <main id="hero" className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-heading">
        <div className="landing-hero-noise" aria-hidden="true" />
        <div className="landing-hero-orbit-line landing-hero-orbit-line-one" aria-hidden="true" />
        <div className="landing-hero-orbit-line landing-hero-orbit-line-two" aria-hidden="true" />

        <div className="landing-hero-content">
          <div className="landing-copy">
            <div className="landing-eyebrow">
              <span className="eyebrow-pulse" aria-hidden="true" />
              Protein <span>×</span> Biomaterial interactions
            </div>
            <h1 id="landing-heading" className="landing-heading">
              Explore the
              <span className="landing-heading-accent"> molecular interface</span>
              <em>between biology &amp; materials.</em>
            </h1>
            <p className="landing-description">
              ProMatDB brings proteins, biomaterials, molecular interactions, docking,
              and structural information into one focused research workspace.
            </p>
            <div className="landing-hero-actions">
              <Link href="/workspace" className="landing-primary-cta">
                Explore ProMatDB
                <ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <Link href="/login" className="landing-secondary-cta">
                Sign in
              </Link>
            </div>
            <div className="landing-trust-line">
              <ScanLine size={15} strokeWidth={1.5} aria-hidden="true" />
              <span>Conceptual interface / made for molecular discovery</span>
            </div>
          </div>

          <MolecularScene />
        </div>

        <div className="landing-hero-footer">
          <div className="landing-footer-note">
            <span className="footer-note-index">01</span>
            <span className="footer-note-rule" />
            <span>Mapping the space between structure and surface</span>
          </div>
          <a href="#interface" className="landing-scroll-cue">
            <span>Scroll to explore</span>
            <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
          </a>
          <div className="landing-footer-code">PMDB / 2026 / OPEN INTERFACE</div>
        </div>
      </section>
    </main>
  );
}

