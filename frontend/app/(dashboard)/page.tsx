// File: app/page.tsx

import {
  Dna,
  FlaskConical,
  Network,
  UploadCloud,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/services/api";
import StatCard from "@/components/ui/StatCard";



const quickActions = [
  {
    label: "Explore Proteins",
    href: "/proteins",
    icon: Dna,
    variant: "primary" as const,
  },
  {
    label: "Explore Biomaterials",
    href: "/biomaterials",
    icon: FlaskConical,
    variant: "secondary" as const,
  },
  {
    label: "View Interactions",
    href: "/interactions",
    icon: Network,
    variant: "secondary" as const,
  },
  {
    label: "Import Protein",
    href: "/import-protein",
    icon: UploadCloud,
    variant: "secondary" as const,
  },
];

export default async function DashboardPage() {
  const dashboard = await getDashboardStats();

  const stats = [
    {
      title: "Total Proteins",
      value: dashboard.total_proteins.toString(),
      description: "Registered protein entries",
      icon: Dna,
    },
    {
      title: "Total Biomaterials",
      value: dashboard.total_biomaterials.toString(),
      description: "Catalogued biomaterials",
      icon: FlaskConical,
    },
    {
      title: "Total Interactions",
      value: dashboard.total_interactions.toString(),
      description: "Recorded protein interactions",
      icon: Network,
    },
    {
      title: "Imported Today",
      value: dashboard.imported_today.toString(),
      description: "Proteins imported today",
      icon: UploadCloud,
    },
  ];

  const activities = dashboard.recent_activity;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10 animate-[fadeIn_0.4s_ease-out]">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#CBD5E1] bg-white px-3 py-1 text-xs font-semibold text-[#1E40AF] shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Research Platform
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-[32px]">
          Welcome to ProMat<span className="text-[#1E40AF]">DB</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#475569] sm:text-base">
          A structured protein–biomaterial interaction database for
          exploring binding behavior, biocompatibility, and molecular
          structure data.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Bottom sections */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md lg:col-span-2">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E40AF]/10">
              <Clock className="h-4 w-4 text-[#1E40AF]" />
            </div>
            <h2 className="text-base font-semibold tracking-tight text-[#0F172A]">
              Recent Activity
            </h2>
          </div>

          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-[#475569]">
                No activity yet
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                New imports and updates will appear here.
              </p>
            </div>
          ) : (
            <ol className="relative ml-2 space-y-1 border-l-2 border-[#E2E8F0] pl-6">
              {activities.map(
                (
                  activity: {
                    title: string;
                    detail: string;
                    time: number;
                  },
                  index: number
                ) => (
                  <li
                    key={index}
                    className="group relative -ml-6 rounded-xl py-3 pl-6 pr-2 transition-colors duration-200 hover:bg-[#F8FAFC]"
                  >
                    <span className="absolute -left-[7px] top-[18px] h-3 w-3 rounded-full border-2 border-white bg-[#1E40AF] ring-4 ring-[#1E40AF]/10 transition-transform duration-200 group-hover:scale-110" />
                    <p className="text-sm font-medium text-[#0F172A]">
                      {activity.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[#475569]">
                      {activity.detail}
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-[#94A3B8]">
                      ID #{activity.time}
                    </p>
                  </li>
                )
              )}
            </ol>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <h2 className="mb-6 text-base font-semibold tracking-tight text-[#0F172A]">
            Quick Actions
          </h2>

          <div className="flex flex-col gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const isPrimary = action.variant === "primary";

              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`group flex h-[52px] items-center justify-between rounded-xl px-4 text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 ${
                    isPrimary
                      ? "bg-[#1E40AF] text-white shadow-sm hover:bg-[#1E3A8A] hover:shadow-md"
                      : "border border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#3B82F6]/40 hover:bg-[#3B82F6]/5"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isPrimary ? "text-white" : "text-[#1E40AF]"
                      }`}
                    />
                    {action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}