// File: components/layout/Navbar.tsx

"use client";

import Link from "next/link";
import { Bell, Menu, Search, Moon } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [isDark, setIsDark] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full items-center gap-4 border-b border-[#E2E8F0]/80 bg-white/70 px-4 shadow-sm backdrop-blur-xl sm:px-6">
      {/* Mobile / tablet menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors duration-300 hover:bg-[#06B6D4]/10 hover:text-[#0F766E] lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo (mobile only, sidebar has it on desktop) */}
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F766E] to-[#06B6D4] text-sm font-bold text-white shadow-sm">
          PM
        </div>
      </Link>

      {/* Search bar - centered */}
      <div className="mx-auto flex w-full max-w-md flex-1 justify-center">
        <div className="relative hidden w-full max-w-md md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search proteins, biomaterials, interactions..."
            className="w-full rounded-xl border border-[#E2E8F0] bg-white/60 py-2.5 pl-10 pr-4 text-sm text-[#0F172A] outline-none backdrop-blur-md transition-all duration-300 placeholder:text-slate-400 focus:border-[#0F766E] focus:bg-white focus:ring-2 focus:ring-[#06B6D4]/30"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-3">
        {/* Mobile search trigger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors duration-300 hover:bg-[#06B6D4]/10 hover:text-[#0F766E] md:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Theme toggle (UI only) */}
        <button
          type="button"
          onClick={() => setIsDark((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors duration-300 hover:bg-[#06B6D4]/10 hover:text-[#0F766E]"
          aria-label="Toggle theme"
          aria-pressed={isDark}
        >
          <Moon className="h-5 w-5" />
        </button>

        {/* Notification button */}
        <button
          type="button"
          className="relative inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors duration-300 hover:bg-[#06B6D4]/10 hover:text-[#0F766E]"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gradient-to-br from-[#0F766E] to-[#06B6D4] ring-2 ring-white" />
        </button>

        {/* User avatar */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1 transition-colors duration-300 hover:bg-[#06B6D4]/10"
          aria-label="User profile"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#06B6D4] text-sm font-semibold text-white shadow-sm">
            U
          </div>
        </button>
      </div>
    </header>
  );
}