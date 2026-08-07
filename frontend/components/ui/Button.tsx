// File: components/ui/Button.tsx
// New reusable primitive — additive only, does not replace any
// existing button markup in Navbar/Sidebar.

import { ButtonHTMLAttributes, forwardRef } from "react";
import { LucideIcon, Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  isLoading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#1E3A8A] text-white shadow-sm hover:bg-[#1E3A8A]/90 active:bg-[#1E3A8A]",
  secondary:
    "bg-white text-[#0F172A] border border-[#CBD5E1] shadow-sm hover:border-[#2563EB]/40 hover:bg-[#F8FAFC]",
  ghost: "bg-transparent text-[#475569] hover:bg-[#2563EB]/10 hover:text-[#1E3A8A]",
  danger: "bg-[#DC2626] text-white shadow-sm hover:bg-[#DC2626]/90",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      isLoading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          Icon && <Icon className="h-4 w-4" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;