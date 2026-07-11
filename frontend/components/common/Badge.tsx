import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color?: "teal" | "cyan" | "indigo" | "gray";
}

export default function Badge({
  children,
  color = "teal",
}: BadgeProps) {
  const colors = {
    teal: "bg-teal-100 text-teal-800",
    cyan: "bg-cyan-100 text-cyan-800",
    indigo: "bg-indigo-100 text-indigo-800",
    gray: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors[color]}`}
    >
      {children}
    </span>
  );
}