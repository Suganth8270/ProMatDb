"use client";

import Link from "next/link";
import {
  Bell,
  Menu,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import GlobalSearch from "@/components/common/GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onMenuClick?: () => void;
}

const subscribeNoop = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getClientMounted,
    getServerMounted
  );

  const isDark = mounted && theme === "dark";

  const handleThemeToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className="
        sticky top-0 z-30
        flex h-[72px] w-full items-center gap-4
        border-b border-[var(--color-border-soft)]
        bg-[var(--color-surface)]/80
        px-4 backdrop-blur-xl
        transition-colors duration-300
        sm:px-6 lg:px-10
      "
    >
      {/* Mobile / tablet menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="
          inline-flex items-center justify-center
          rounded-lg p-2
          text-[var(--color-text-secondary)]
          transition-all duration-200
          hover:bg-[var(--color-primary)]/10
          hover:text-[var(--color-primary)]
          focus-visible:outline-none
          lg:hidden
        "
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo - mobile only */}
      <Link
        href="/dashboard"
        className="
          flex shrink-0 items-center gap-2
          rounded-lg
          focus-visible:outline-none
          lg:hidden
        "
      >
        <div
          className="
            flex h-9 w-9 items-center justify-center
            rounded-lg
            bg-[var(--color-primary)]
            font-data text-sm font-bold text-white
            shadow-sm
          "
        >
          PM
        </div>
      </Link>

      {/* Global Search */}
      <div className="mx-auto hidden w-full max-w-md flex-1 md:block">
        <GlobalSearch />
      </div>

      <Link href="/docking" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] sm:inline-flex">Docking</Link>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-1.5">

        {/* Mobile search */}
        <button
          type="button"
          className="
            inline-flex items-center justify-center
            rounded-lg p-2
            text-[var(--color-text-secondary)]
            transition-all duration-200
            hover:bg-[var(--color-primary)]/10
            hover:text-[var(--color-primary)]
            focus-visible:outline-none
            md:hidden
          "
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className="
            inline-flex items-center justify-center
            rounded-lg p-2
            text-[var(--color-text-secondary)]
            transition-all duration-200
            hover:bg-[var(--color-primary)]/10
            hover:text-[var(--color-primary)]
            focus-visible:outline-none
          "
          aria-label={
            isDark
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          aria-pressed={isDark}
        >
          {!mounted ? (
            <Moon className="h-5 w-5" />
          ) : isDark ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="
            relative inline-flex items-center justify-center
            rounded-lg p-2
            text-[var(--color-text-secondary)]
            transition-all duration-200
            hover:bg-[var(--color-primary)]/10
            hover:text-[var(--color-primary)]
            focus-visible:outline-none
          "
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />

          <span
            className="
              absolute right-1.5 top-1.5
              h-2 w-2 rounded-full
              bg-[var(--color-secondary)]
              ring-2 ring-[var(--color-surface)]
            "
          />
        </button>

        {/* Divider */}
        <div
          className="
            mx-1 hidden h-6 w-px
            bg-[var(--color-border-soft)]
            sm:block
          "
        />

        {/* User avatar */}
        <button
          type="button"
          className="
            flex items-center gap-2
            rounded-lg p-1 pr-2
            transition-all duration-200
            hover:bg-[var(--color-primary)]/10
            focus-visible:outline-none
          "
          aria-label="Open user profile"
        >
          <div
            className="
              flex h-8 w-8 items-center justify-center
              rounded-full
              bg-[var(--color-primary)]
              text-sm font-semibold text-white
              shadow-sm
            "
          >
            {(user?.username?.[0] ?? "?").toUpperCase()}
          </div>
        </button>
      </div>
    </header>
  );
}


