// File: components/ui/StatCard.tsx

import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  /** Optional — omit to render the card exactly as before. */
  trend?: {
    value: string;
    direction: "up" | "down";
  };
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2563EB]/30 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E3A8A]/10 transition-colors duration-200 group-hover:bg-[#1E3A8A]">
          <Icon className="h-5 w-5 text-[#1E3A8A] transition-colors duration-200 group-hover:text-white" />
        </div>

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium font-data ${
              trend.direction === "up"
                ? "bg-[#16A34A]/10 text-[#16A34A]"
                : "bg-[#DC2626]/10 text-[#DC2626]"
            }`}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="font-data text-[28px] font-bold leading-none tracking-tight text-[#0F172A]">
          {value}
        </p>
        <p className="mt-2 text-sm font-semibold text-[#0F172A]">{title}</p>
        <p className="mt-1 text-xs text-[#64748B]">{description}</p>
      </div>
    </div>
  );
}