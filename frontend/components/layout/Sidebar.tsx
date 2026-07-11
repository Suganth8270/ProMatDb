// File: components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Settings, LogOut } from "lucide-react";
import { navigationItems } from "@/constants/navigation";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-2">
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-r from-[#0F766E] to-[#0F766E]/90 text-white shadow-md shadow-[#0F766E]/20"
                : "text-slate-600 hover:translate-x-0.5 hover:bg-[#06B6D4]/10 hover:text-[#0F766E]"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#06B6D4]" />
            )}
            <Icon
              className={`h-5 w-5 shrink-0 transition-colors duration-300 ${
                isActive
                  ? "text-white"
                  : "text-slate-400 group-hover:text-[#06B6D4]"
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const bottomSection = (
    <div className="border-t border-[#E2E8F0] px-4 py-4">
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-300 hover:bg-[#06B6D4]/10"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0F766E] to-[#06B6D4] text-sm font-semibold text-white shadow-sm">
          U
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#0F172A]">
            User Name
          </p>
          <p className="truncate text-xs text-slate-400">user@promatdb.com</p>
        </div>
      </button>

      <div className="mt-1 flex flex-col gap-0.5">
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-300 hover:bg-[#06B6D4]/10 hover:text-[#0F766E]"
        >
          <Settings className="h-[18px] w-[18px] text-slate-400" />
          Settings
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-300 hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
        >
          <LogOut className="h-[18px] w-[18px] text-slate-400" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col border-r border-[#E2E8F0] bg-white lg:flex">
        <div className="flex h-[72px] items-center gap-2 border-b border-[#E2E8F0] px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F766E] to-[#06B6D4] text-sm font-bold text-white shadow-sm">
            PM
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#0F172A]">
            ProMat
            <span className="bg-gradient-to-r from-[#0F766E] to-[#06B6D4] bg-clip-text text-transparent">
              DB
            </span>
          </span>
        </div>
        {navContent}
        {bottomSection}
      </aside>

      {/* Mobile / tablet overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0F172A]/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile / tablet drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-[#E2E8F0] bg-white transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-[#E2E8F0] px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F766E] to-[#06B6D4] text-sm font-bold text-white shadow-sm">
              PM
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#0F172A]">
              ProMat
              <span className="bg-gradient-to-r from-[#0F766E] to-[#06B6D4] bg-clip-text text-transparent">
                DB
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors duration-300 hover:bg-[#06B6D4]/10 hover:text-[#0F766E]"
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