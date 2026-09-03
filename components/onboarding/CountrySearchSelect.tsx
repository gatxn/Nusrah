"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, codeToFlagEmoji, type Country } from "@/lib/geo";
import { SearchIcon } from "@/components/icons";

export default function CountrySearchSelect({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  noResultsText,
}: {
  value: Country | undefined;
  onChange: (country: Country) => void;
  placeholder: string;
  searchPlaceholder: string;
  noResultsText: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    searchInputRef.current?.focus();
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-start text-sm focus:border-primary focus:outline-none"
      >
        <span className="text-xl" aria-hidden="true">
          {value ? codeToFlagEmoji(value.code) : "🏳️"}
        </span>
        <span className={value ? "text-navy" : "text-neutral-400"}>{value ? value.name : placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2">
            <SearchIcon className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-sm outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-500">{noResultsText}</li>
            ) : (
              filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm hover:bg-blush-50 ${
                      value?.code === c.code ? "bg-blush-50 font-semibold text-primary" : "text-navy"
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">
                      {codeToFlagEmoji(c.code)}
                    </span>
                    {c.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
