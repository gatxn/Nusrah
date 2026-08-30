"use client";

import { useEffect, useRef, useState } from "react";
import MemberCard from "@/components/wanachama/MemberCard";
import FilterPanel, { type AppliedFilters } from "@/components/wanachama/FilterPanel";
import { SlidersIcon, SearchIcon, CloseIcon } from "@/components/icons";
import { MIN_AGE, MAX_AGE } from "@/lib/onboarding";
import type { SerializedProfile } from "@/lib/profiles";

const DEFAULT_FILTERS: AppliedFilters = { minAge: MIN_AGE, maxAge: MAX_AGE, regions: [] };
const STORAGE_KEY = "nusrah:wanachama-filters";

function isDefaultFilters(f: AppliedFilters): boolean {
  return f.minAge === DEFAULT_FILTERS.minAge && f.maxAge === DEFAULT_FILTERS.maxAge && f.regions.length === 0;
}

/** Reads last-used filters for this browser session (not permanently), if any. */
function readStoredFilters(): AppliedFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as AppliedFilters;
    return isDefaultFilters(stored) ? null : stored;
  } catch {
    return null;
  }
}

export default function MembersBrowser({
  initialProfiles,
  initialHasMore,
  viewLimit,
  mode,
}: {
  initialProfiles: SerializedProfile[];
  initialHasMore: boolean;
  viewLimit: number | null;
  mode: "browse" | "favorites";
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AppliedFilters>(() => readStoredFilters() ?? DEFAULT_FILTERS);
  const hydrated = useRef(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  function buildParams(targetPage: number, f: AppliedFilters, s: string) {
    const params = new URLSearchParams();
    if (f.minAge !== MIN_AGE) params.set("minAge", String(f.minAge));
    if (f.maxAge !== MAX_AGE) params.set("maxAge", String(f.maxAge));
    if (f.regions.length) params.set("regions", f.regions.join(","));
    if (s) params.set("search", s);
    if (mode === "favorites") params.set("favoritesOnly", "1");
    params.set("page", String(targetPage));
    return params;
  }

  async function fetchPage(targetPage: number, f: AppliedFilters, s: string, replace: boolean) {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles?${buildParams(targetPage, f, s).toString()}`);
      const json = await res.json();
      if (!res.ok) return;
      setProfiles((prev) => (replace ? json.profiles : [...prev, ...json.profiles]));
      setHasMore(json.hasMore);
      setPage(targetPage);
    } finally {
      setLoading(false);
    }
  }

  // `filters` is already hydrated from sessionStorage via the lazy useState
  // initializer above; this effect only kicks off the matching re-fetch
  // (the SSR-rendered initialProfiles reflect no filters) — it never sets
  // `filters` itself, so there's no synchronous setState-in-effect.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (!isDefaultFilters(filters)) {
      // Deferred to a microtask so fetchPage's setLoading(true) runs as a
      // callback, not synchronously within the effect body.
      Promise.resolve().then(() => fetchPage(1, filters, "", true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time hydration fetch on mount
  }, []);

  function applyFilters(next: AppliedFilters) {
    setFilters(next);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    fetchPage(1, next, search, true);
  }

  function removeRegion(region: string) {
    applyFilters({ ...filters, regions: filters.regions.filter((r) => r !== region) });
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    window.sessionStorage.removeItem(STORAGE_KEY);
    fetchPage(1, DEFAULT_FILTERS, search, true);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    fetchPage(1, filters, searchInput, true);
  }

  const filtersActive = filters.minAge !== MIN_AGE || filters.maxAge !== MAX_AGE || filters.regions.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 min-w-[220px]">
          <SearchIcon className="h-4 w-4 text-neutral-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tafuta Wanachama"
            className="w-full text-sm outline-none"
          />
        </form>

        <div className="relative" ref={filterPanelRef}>
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              filtersActive ? "border-primary text-primary" : "border-black/10 text-neutral-600"
            }`}
          >
            <SlidersIcon className="h-4 w-4" /> Vigezo
          </button>
          {panelOpen && (
            <FilterPanel initial={filters} onApply={applyFilters} onClose={() => setPanelOpen(false)} />
          )}
        </div>
      </div>

      {filters.regions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {filters.regions.map((region) => (
            <span
              key={region}
              className="flex items-center gap-1 rounded-full bg-blush-50 px-3 py-1 text-xs font-medium text-primary-dark"
            >
              {region}
              <button type="button" onClick={() => removeRegion(region)} aria-label={`Ondoa ${region}`}>
                <CloseIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {viewLimit !== null && (
        <p className="mt-3 text-xs text-neutral-500">
          Unaonyeshwa hadi wasifu {viewLimit} kwa siku kwenye kifurushi chako
        </p>
      )}

      {profiles.length === 0 && !loading ? (
        <div className="mt-14 text-center">
          <p className="text-sm text-neutral-500">
            {mode === "favorites"
              ? "Bado hujampenda mwanachama yeyote."
              : "Hakuna wanachama waliopatikana kwa vigezo hivi. Jaribu kubadilisha uchujaji."}
          </p>
          {mode === "browse" && filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Futa Vigezo
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <MemberCard key={profile.userId} profile={profile} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => fetchPage(page + 1, filters, search, false)}
            disabled={loading}
            className="rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-blush-50 disabled:opacity-60"
          >
            {loading ? "Inapakia..." : "Pakia Zaidi"}
          </button>
        </div>
      )}
    </div>
  );
}
