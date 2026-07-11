import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseStyle =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-[#0F766E] text-white hover:bg-[#0D5F59] hover:shadow-lg focus:ring-[#0F766E]",

    secondary:
      "bg-[#06B6D4] text-white hover:bg-[#0891B2] hover:shadow-lg focus:ring-[#06B6D4]",

    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-[#0F766E] hover:text-[#0F766E] hover:bg-[#F0FDFA] focus:ring-[#0F766E]",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}