"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES, codeToFlagEmoji, type Country } from "@/lib/geo";
import { SearchIcon } from "@/components/icons";

export default function PhoneCountryCodeSelect({
  value,
  onChange,
  triggerAria,
  searchPlaceholder,
  noResultsText,
}: {
  value: Country;
  onChange: (country: Country) => void;
  triggerAria: string;
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
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q)
    );
  }, [query]);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={triggerAria}
        className="flex h-full items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm focus:border-primary focus:outline-none"
      >
        <span className="text-lg" aria-hidden="true">
          {codeToFlagEmoji(value.code)}
        </span>
        <span className="text-navy">{value.dialCode}</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-64 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg">
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
                      value.code === c.code ? "bg-blush-50 font-semibold text-primary" : "text-navy"
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">
                      {codeToFlagEmoji(c.code)}
                    </span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-neutral-400">{c.dialCode}</span>
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
