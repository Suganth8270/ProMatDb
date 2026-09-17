// File: components/ui/Input.tsx
// New reusable primitive — additive only, does not replace
// components/common/GlobalSearch.

import { InputHTMLAttributes, forwardRef } from "react";
import { Search } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#2563EB] disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] ${
          error ? "border-[#DC2626]" : "border-[#CBD5E1]"
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
        <input
          ref={ref}
          type="search"
          className={`h-10 w-full rounded-lg border border-[#CBD5E1] bg-white pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#2563EB] ${className}`}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export default Input;
