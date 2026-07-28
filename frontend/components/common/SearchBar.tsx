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
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
      />

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search proteins, biomaterials and interactions"
        className="
          w-full
          rounded-lg
          border
          border-[#CBD5E1]
          bg-[#F8FAFC]
          py-2.5
          pl-11
          pr-4
          text-[14px]
          font-medium
          text-[#0F172A]
          placeholder:text-[#94A3B8]
          outline-none
          transition-all
          duration-200
          focus:border-[#3B82F6]
          focus:bg-white
          focus:ring-4
          focus:ring-[#3B82F6]/10
        "
      />
    </div>
  );
}