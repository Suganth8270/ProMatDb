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
    <div className="group flex h-full flex-col rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#3B82F6]/30 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E40AF]/10 transition-colors duration-300 group-hover:bg-[#1E40AF]">
          <Icon className="h-5 w-5 text-[#1E40AF] transition-colors duration-300 group-hover:text-white" />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[28px] font-bold leading-none tracking-tight text-[#0F172A]">
          {value}
        </p>
        <p className="mt-2 text-sm font-semibold text-[#0F172A]">{title}</p>
        <p className="mt-1 text-xs text-[#94A3B8]">{description}</p>
      </div>
    </div>
  );
}