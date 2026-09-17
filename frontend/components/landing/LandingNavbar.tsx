"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "#hero" },
  { label: "Explore", href: "#interface" },
  { label: "Platform", href: "/workspace" },
];

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="landing-nav-wrap">
      <nav className="landing-nav" aria-label="Main navigation">
        <Link className="landing-brand" href="/" onClick={() => setIsOpen(false)}>
          <span className="landing-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>ProMat<span className="landing-brand-db">DB</span></span>
        </Link>

        <div className="landing-nav-links" aria-label="Primary links">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="landing-nav-link">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="landing-nav-actions">
          <Link href="/login" className="landing-signin-link">
            Sign in
          </Link>
          <Link href="/workspace" className="landing-nav-cta">
            Open workspace
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <button
          type="button"
          className="landing-menu-button"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <div
        id="mobile-navigation"
        className={`landing-mobile-menu${isOpen ? " is-open" : ""}`}
      >
        <div className="landing-mobile-menu-inner">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="landing-mobile-link"
              onClick={() => setIsOpen(false)}
            >
              <span>{item.label}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
          <div className="landing-mobile-actions">
            <Link href="/login" className="landing-mobile-signin" onClick={() => setIsOpen(false)}>
              Sign in
            </Link>
            <Link href="/workspace" className="landing-mobile-cta" onClick={() => setIsOpen(false)}>
              Open workspace <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

