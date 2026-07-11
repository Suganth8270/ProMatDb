"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          rounded-2xl
          border
          border-slate-200
          bg-white
          py-3
          pl-11
          pr-4
          text-sm
          shadow-sm
          outline-none
          transition
          duration-300
          focus:border-[#0F766E]
          focus:ring-2
          focus:ring-[#0F766E]/20
        "
      />
    </div>
  );
}