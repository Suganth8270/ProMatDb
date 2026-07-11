// File: components/ui/StatCard.tsx

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="group rounded-[18px] border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#0F766E]/20 hover:shadow-xl hover:shadow-[#0F766E]/10">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F766E]/10 to-[#06B6D4]/10 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-[#0F766E] group-hover:to-[#06B6D4]">
          <Icon className="h-5 w-5 text-[#0F766E] transition-colors duration-300 group-hover:text-white" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-semibold tracking-tight text-[#0F172A]">
          {value}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700">{title}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}