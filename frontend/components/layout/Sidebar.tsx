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
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
      {navigationItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
              isActive
                ? "bg-[#1E40AF]/10 text-[#1E40AF]"
                : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#1E40AF]" />
            )}
            <Icon
              className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                isActive
                  ? "text-[#1E40AF]"
                  : "text-[#94A3B8] group-hover:text-[#475569]"
              }`}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const bottomSection = (
    <div className="border-t border-[#E2E8F0] px-3 py-4">
      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[#F8FAFC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E40AF] text-sm font-semibold text-white shadow-sm">
          U
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#0F172A]">
            User Name
          </p>
          <p className="truncate text-xs text-[#94A3B8]">
            user@promatdb.com
          </p>
        </div>
      </button>

      <div className="mt-1 flex flex-col gap-0.5">
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#475569] transition-colors duration-200 hover:bg-[#F8FAFC] hover:text-[#1E40AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
        >
          <Settings className="h-[18px] w-[18px] text-[#94A3B8]" />
          Settings
        </button>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#475569] transition-colors duration-200 hover:bg-[#DC2626]/10 hover:text-[#DC2626] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
        >
          <LogOut className="h-[18px] w-[18px] text-[#94A3B8]" />
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E40AF] text-sm font-bold text-white shadow-sm">
            PM
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#0F172A]">
            ProMat<span className="text-[#1E40AF]">DB</span>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E40AF] text-sm font-bold text-white shadow-sm">
              PM
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#0F172A]">
              ProMat<span className="text-[#1E40AF]">DB</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#475569] transition-colors duration-200 hover:bg-[#3B82F6]/10 hover:text-[#1E40AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
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