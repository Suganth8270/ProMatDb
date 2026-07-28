"use client";

import { useEffect, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import { search, SearchResult } from "@/services/api";
import Link from "next/link";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (value: string) => {
    setQuery(value);

    if (!value.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }

    setLoading(true);

    try {
      const data = await search(value);
      setResults(data);
      setOpen(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <SearchBar
        value={query}
        onChange={handleSearch}
        placeholder="Search proteins, biomaterials, interactions..."
      />

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-[#CBD5E1] bg-white shadow-xl">
          {loading && (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#1E40AF]" />
              <span className="text-sm font-medium text-[#475569]">
                Searching...
              </span>
            </div>
          )}

          {!loading && results && (
            <>
              {/* Proteins */}
              {results.proteins.length > 0 && (
                <div className="border-b border-[#E2E8F0] last:border-b-0">
                  <div className="sticky top-0 bg-[#F8FAFC] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
                    Proteins
                  </div>

                  {results.proteins.map((protein) => (
                    <Link
                      key={protein.id}
                      href={`/proteins/${protein.id}`}
                      className="block border-l-2 border-transparent px-4 py-3 transition-all duration-150 hover:border-[#1E40AF] hover:bg-[#F8FAFC]"
                      onClick={() => setOpen(false)}
                    >
                      <div className="text-[15px] font-semibold text-[#0F172A]">
                        {protein.protein_name}
                      </div>

                      <div className="mt-1 text-[13px] text-[#475569]">
                        {protein.uniprot_id}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Biomaterials */}
              {results.biomaterials.length > 0 && (
                <div className="border-b border-[#E2E8F0] last:border-b-0">
                  <div className="sticky top-0 bg-[#F8FAFC] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
                    Biomaterials
                  </div>

                  {results.biomaterials.map((bio) => (
                    <Link
                      key={bio.id}
                      href={`/biomaterials/${bio.id}`}
                      className="block border-l-2 border-transparent px-4 py-3 transition-all duration-150 hover:border-[#1E40AF] hover:bg-[#F8FAFC]"
                      onClick={() => setOpen(false)}
                    >
                      <div className="text-[15px] font-semibold text-[#0F172A]">
                        {bio.name}
                      </div>

                      <div className="mt-1 text-[13px] text-[#475569]">
                        {bio.category}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Interactions */}
              {results.interactions.length > 0 && (
                <div>
                  <div className="sticky top-0 bg-[#F8FAFC] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
                    Interactions
                  </div>

                  {results.interactions.map((interaction) => (
                    <Link
                      key={interaction.id}
                      href={`/interactions/${interaction.id}`}
                      className="block border-l-2 border-transparent px-4 py-3 transition-all duration-150 hover:border-[#1E40AF] hover:bg-[#F8FAFC]"
                      onClick={() => setOpen(false)}
                    >
                      <div className="text-[15px] font-semibold text-[#0F172A]">
                        {interaction.protein}
                      </div>

                      <div className="mt-1 text-[13px] text-[#475569]">
                        {interaction.biomaterial}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.proteins.length === 0 &&
                results.biomaterials.length === 0 &&
                results.interactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-sm font-medium text-[#475569]">
                      No results found
                    </p>

                    <p className="mt-1 text-xs text-[#94A3B8]">
                      Try another protein, biomaterial or interaction.
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}