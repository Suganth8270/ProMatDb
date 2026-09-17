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
    <div className="group flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 transition-colors duration-200 group-hover:bg-[var(--color-primary)]">
          <Icon className="h-5 w-5 text-[var(--color-primary)] transition-colors duration-200 group-hover:text-white" />
        </div>

        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium font-data ${
              trend.direction === "up"
                ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
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
        <p className="font-data text-[28px] font-bold leading-none tracking-tight text-[var(--color-text)]">
          {value}
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </div>
  );
}