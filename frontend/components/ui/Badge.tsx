// File: components/ui/Badge.tsx
// New reusable primitive — additive only.

import { ReactNode } from "react";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Renders the label in the tabular data font — use for IDs, codes, versions. */
  mono?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-[#F1F5F9] text-[#475569] ring-1 ring-inset ring-[#E2E8F0]",
  primary: "bg-[#1E3A8A]/10 text-[#1E3A8A] ring-1 ring-inset ring-[#1E3A8A]/15",
  success: "bg-[#16A34A]/10 text-[#16A34A] ring-1 ring-inset ring-[#16A34A]/15",
  warning: "bg-[#EA580C]/10 text-[#EA580C] ring-1 ring-inset ring-[#EA580C]/15",
  danger: "bg-[#DC2626]/10 text-[#DC2626] ring-1 ring-inset ring-[#DC2626]/15",
};

export default function Badge({
  children,
  variant = "neutral",
  mono = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        mono ? "font-data" : ""
      } ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}