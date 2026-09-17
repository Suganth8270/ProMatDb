// File: components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Settings, LogOut } from "lucide-react";
import { navigationItems } from "@/constants/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const brand = (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)] font-data text-sm font-bold text-white shadow-sm">
        PM
      </div>
      <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
        ProMat<span className="text-[var(--color-primary)]">DB</span>
      </span>
    </div>
  );

  const navContent = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Navigation
      </p>
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none ${
              isActive
                ? "bg-[var(--color-primary)]/8 text-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-primary)]" />
            )}
            <Icon
              className={`h-[18px] w-[18px] shrink-0 transition-colors duration-150 ${
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const bottomSection = (
    <div className="border-t border-[var(--color-border-soft)] px-3 py-4">
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--color-surface-soft)] focus-visible:outline-none"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white shadow-sm">
          {(user?.username?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-text)]">
            {user?.username ?? "Authenticated user"}
          </p>
          <p className="truncate text-xs text-[var(--color-text-muted)]">
            {user?.username ?? ""}
          </p>
        </div>
      </button>

      <div className="mt-1 flex flex-col gap-0.5">
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-none"
        >
          <Settings className="h-[18px] w-[18px] text-[var(--color-text-muted)]" />
          Settings
        </button>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] focus-visible:outline-none"
        >
          <LogOut className="h-[18px] w-[18px] text-[var(--color-text-muted)]" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col border-r border-[var(--color-border-soft)] bg-[var(--color-surface)] transition-colors duration-300 lg:flex">
        <div className="flex h-[72px] items-center border-b border-[var(--color-border-soft)] px-6">
          {brand}
        </div>
        {navContent}
        {bottomSection}
      </aside>

      {/* Mobile / tablet overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--color-text)]/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile / tablet drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-[var(--color-border-soft)] bg-[var(--color-surface)] transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-[var(--color-border-soft)] px-6">
          {brand}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] focus-visible:outline-none"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navContent}
        {bottomSection}
      </aside>
    </>
  );
}


