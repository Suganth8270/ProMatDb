// File: components/layout/DashboardLayout.tsx

"use client";

import { useState, ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Right column: navbar + independently scrolling content */}
      <div className="flex h-screen w-full flex-1 flex-col lg:ml-[280px]">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-8 sm:px-6 lg:px-10">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}