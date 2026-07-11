// File: app/page.tsx

import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Dna,
  FlaskConical,
  Network,
  UploadCloud,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/ui/StatCard";

const stats = [
  {
    title: "Total Proteins",
    value: "1,284",
    description: "Registered protein entries",
    icon: Dna,
  },
  {
    title: "Total Biomaterials",
    value: "356",
    description: "Catalogued biomaterials",
    icon: FlaskConical,
  },
  {
    title: "Total Interactions",
    value: "2,910",
    description: "Recorded protein interactions",
    icon: Network,
  },
  {
    title: "Imported Proteins",
    value: "184",
    description: "Proteins imported this month",
    icon: UploadCloud,
  },
];

const activities = [
  {
    title: "Protein imported",
    detail: "Hemoglobin subunit alpha (HBA1) was imported successfully.",
    time: "5 minutes ago",
  },
  {
    title: "New interaction added",
    detail: "Interaction between Collagen I and Fibronectin recorded.",
    time: "42 minutes ago",
  },
  {
    title: "Biomaterial updated",
    detail: "Titanium Alloy Ti-6Al-4V properties were updated.",
    time: "2 hours ago",
  },
  {
    title: "Protein imported",
    detail: "Bovine Serum Albumin (BSA) added to the database.",
    time: "5 hours ago",
  },
  {
    title: "New interaction added",
    detail: "Interaction between Elastin and Hydroxyapatite recorded.",
    time: "Yesterday",
  },
];

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

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1600px]">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            Welcome to ProMat
            <span className="bg-gradient-to-r from-[#0F766E] to-[#06B6D4] bg-clip-text text-transparent">
              DB
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Protein–Biomaterial Interaction Database
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Bottom sections */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md lg:col-span-2">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0F766E]/10 to-[#06B6D4]/10">
                <Clock className="h-4 w-4 text-[#0F766E]" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
                Recent Activity
              </h2>
            </div>

            <ol className="relative ml-2 space-y-6 border-l-2 border-[#E2E8F0] pl-6">
              {activities.map((activity, index) => (
                <li key={index} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-gradient-to-br from-[#0F766E] to-[#06B6D4] ring-4 ring-[#06B6D4]/10" />
                  <p className="text-sm font-medium text-[#0F172A]">
                    {activity.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {activity.detail}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {activity.time}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Quick Actions */}
          <div className="rounded-[18px] border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
            <h2 className="mb-6 text-lg font-semibold tracking-tight text-[#0F172A]">
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
                    className={`group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isPrimary
                        ? "bg-gradient-to-r from-[#0F766E] to-[#06B6D4] text-white shadow-md hover:shadow-lg hover:shadow-[#0F766E]/30 hover:brightness-105"
                        : "border border-[#E2E8F0] bg-white text-slate-700 hover:border-[#4F46E5]/30 hover:bg-[#4F46E5]/5 hover:text-[#4F46E5]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 ${
                          isPrimary ? "text-white" : "text-[#4F46E5]"
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
    </DashboardLayout>
  );
}