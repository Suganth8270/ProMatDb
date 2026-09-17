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
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Research Platform
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] sm:text-[32px]">
          Welcome to ProMat<span className="text-[var(--color-primary)]">DB</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
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
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-shadow duration-300 hover:shadow-md lg:col-span-2">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
              <Clock className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
              Recent Activity
            </h2>
          </div>

          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                No activity yet
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                New imports and updates will appear here.
              </p>
            </div>
          ) : (
            <ol className="relative ml-2 space-y-1 border-l-2 border-[var(--color-border-soft)] pl-6">
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
                    className="group relative -ml-6 rounded-xl py-3 pl-6 pr-2 transition-colors duration-200 hover:bg-[var(--color-surface-soft)]"
                  >
                    <span className="absolute -left-[7px] top-[18px] h-3 w-3 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10 transition-transform duration-200 group-hover:scale-110" />
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {activity.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                      {activity.detail}
                    </p>
                    <p className="mt-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                      ID #{activity.time}
                    </p>
                  </li>
                )
              )}
            </ol>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <h2 className="mb-6 text-base font-semibold tracking-tight text-[var(--color-text)]">
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
                  className={`group flex h-[52px] items-center justify-between rounded-xl px-4 text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2 ${
                    isPrimary
                      ? "bg-[var(--color-primary)] text-white shadow-sm hover:bg-[var(--color-primary-hover)] hover:shadow-md"
                      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isPrimary ? "text-white" : "text-[var(--color-primary)]"
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