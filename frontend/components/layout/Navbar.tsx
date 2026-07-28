// File: components/layout/Navbar.tsx

"use client";

import Link from "next/link";
import { Bell, Menu, Search, Moon } from "lucide-react";
import { useState } from "react";
import GlobalSearch from "@/components/common/GlobalSearch";

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [isDark, setIsDark] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full items-center gap-4 border-b border-[#CBD5E1]/70 bg-white/75 px-4 backdrop-blur-xl sm:px-6">
      {/* Mobile / tablet menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex items-center justify-center rounded-lg p-2 text-[#475569] transition-colors duration-200 hover:bg-[#3B82F6]/10 hover:text-[#1E40AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo (mobile only, sidebar has it on desktop) */}
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-2 lg:hidden"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E40AF] text-sm font-bold text-white shadow-sm">
          PM
        </div>
      </Link>

      {/* Global Search */}
      <div className="mx-auto hidden w-full max-w-md flex-1 md:block">
        <GlobalSearch />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
        {/* Mobile search trigger */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#475569] transition-colors duration-200 hover:bg-[#3B82F6]/10 hover:text-[#1E40AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] md:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Theme toggle (UI only) */}
        <button
          type="button"
          onClick={() => setIsDark((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-[#475569] transition-colors duration-200 hover:bg-[#3B82F6]/10 hover:text-[#1E40AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          aria-label="Toggle theme"
          aria-pressed={isDark}
        >
          <Moon className="h-5 w-5" />
        </button>

        {/* Notification button */}
        <button
          type="button"
          className="relative inline-flex items-center justify-center rounded-lg p-2 text-[#475569] transition-colors duration-200 hover:bg-[#3B82F6]/10 hover:text-[#1E40AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#3B82F6] ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="mx-1 hidden h-6 w-px bg-[#E2E8F0] sm:block" />

        {/* User avatar */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors duration-200 hover:bg-[#3B82F6]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          aria-label="Open user profile"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E40AF] text-sm font-semibold text-white shadow-sm">
            U
          </div>
        </button>
      </div>
    </header>
  );
}