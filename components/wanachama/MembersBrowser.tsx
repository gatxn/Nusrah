"use client";

import { useEffect, useRef, useState } from "react";
import MemberCard from "@/components/wanachama/MemberCard";
import MemberRow from "@/components/wanachama/MemberRow";
import FilterPanel, { DEFAULT_FILTERS, type AppliedFilters } from "@/components/wanachama/FilterPanel";
import { SlidersIcon, SearchIcon, CloseIcon, GridIcon, ListIcon } from "@/components/icons";
import { MIN_AGE, MAX_AGE } from "@/lib/onboarding";
import type { SerializedProfile } from "@/lib/profiles";
import type { MemberSortMode } from "@/lib/validation";
import type { Dictionary } from "@/app/[locale]/dictionaries";

const STORAGE_KEY = "nusrah:wanachama-filters";
const VIEW_STORAGE_KEY = "nusrah:wanachama-view";

function isDefaultFilters(f: AppliedFilters): boolean {
  return (
    f.minAge === DEFAULT_FILTERS.minAge &&
    f.maxAge === DEFAULT_FILTERS.maxAge &&
    f.regions.length === 0 &&
    f.maritalStatuses.length === 0 &&
    f.madhhabs.length === 0 &&
    f.hijab.length === 0 &&
    f.intentions.length === 0 &&
    !f.verifiedOnly
  );
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

function readStoredView(): "grid" | "list" {
  if (typeof window === "undefined") return "grid";
  return window.sessionStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "grid";
}

export default function MembersBrowser({
  initialProfiles,
  initialHasMore,
  viewLimit,
  mode,
  viewerGender = null,
  initialSearch = "",
  dict,
  labels,
}: {
  initialProfiles: SerializedProfile[];
  initialHasMore: boolean;
  viewLimit: number | null;
  mode: "browse" | "favorites";
  viewerGender?: string | null;
  initialSearch?: string;
  dict: Dictionary["wanachama"];
  labels: Dictionary["common"]["labels"];
}) {
  const t = dict.browser;
  const [profiles, setProfiles] = useState(initialProfiles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  // Both start at the SSR-safe default (sessionStorage doesn't exist on the
  // server) and are corrected, if needed, by the post-mount effect below —
  // reading storage inside a useState lazy initializer instead would make
  // the client's very first render (used for hydration matching) diverge
  // from what the server actually sent, and React would throw a hydration
  // mismatch the moment any non-default preference was already stored.
  const [filters, setFilters] = useState<AppliedFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<MemberSortMode>("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
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

  function buildParams(targetPage: number, f: AppliedFilters, s: string, sortMode: MemberSortMode) {
    const params = new URLSearchParams();
    if (f.minAge !== MIN_AGE) params.set("minAge", String(f.minAge));
    if (f.maxAge !== MAX_AGE) params.set("maxAge", String(f.maxAge));
    if (f.regions.length) params.set("regions", f.regions.join(","));
    if (f.maritalStatuses.length) params.set("maritalStatuses", f.maritalStatuses.join(","));
    if (f.madhhabs.length) params.set("madhhabs", f.madhhabs.join(","));
    if (f.hijab.length) params.set("hijab", f.hijab.join(","));
    if (f.intentions.length) params.set("intentions", f.intentions.join(","));
    if (f.verifiedOnly) params.set("verifiedOnly", "1");
    if (s) params.set("search", s);
    if (mode === "favorites") params.set("favoritesOnly", "1");
    if (sortMode !== "recent") params.set("sort", sortMode);
    params.set("page", String(targetPage));
    return params;
  }

  async function fetchPage(
    targetPage: number,
    f: AppliedFilters,
    s: string,
    replace: boolean,
    sortMode: MemberSortMode = sort
  ) {
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles?${buildParams(targetPage, f, s, sortMode).toString()}`);
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

    // Deferred to a microtask rather than calling setState synchronously in
    // the effect body (same reasoning as fetchPage's own deferral below).
    Promise.resolve().then(() => {
      if (readStoredView() === "list") setView("list");
      const storedFilters = readStoredFilters();
      if (storedFilters) {
        setFilters(storedFilters);
        // `initialSearch` (if any) was already applied server-side to
        // `initialProfiles`, so this only needs to layer the stored filters
        // on top of it.
        fetchPage(1, storedFilters, initialSearch, true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time hydration restore on mount
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

  function changeSort(next: MemberSortMode) {
    setSort(next);
    fetchPage(1, filters, search, true, next);
  }

  function changeView(next: "grid" | "list") {
    setView(next);
    window.sessionStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    fetchPage(1, filters, searchInput, true);
  }

  const filtersActive =
    filters.minAge !== MIN_AGE ||
    filters.maxAge !== MAX_AGE ||
    filters.regions.length > 0 ||
    filters.maritalStatuses.length > 0 ||
    filters.madhhabs.length > 0 ||
    filters.hijab.length > 0 ||
    filters.intentions.length > 0 ||
    filters.verifiedOnly;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 min-w-[220px]">
          <SearchIcon className="h-4 w-4 text-neutral-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full text-sm outline-none"
          />
        </form>

        <select
          value={sort}
          onChange={(e) => changeSort(e.target.value as MemberSortMode)}
          className="rounded-full border border-black/10 px-3 py-2.5 text-sm font-semibold text-neutral-600 focus:border-primary focus:outline-none"
        >
          <option value="recent">{t.sortRecent}</option>
          <option value="best_match">{t.sortBestMatch}</option>
        </select>

        <div className="flex items-center rounded-full border border-black/10 p-1">
          <button
            type="button"
            onClick={() => changeView("grid")}
            aria-label={t.gridViewAria}
            aria-pressed={view === "grid"}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${view === "grid" ? "bg-blush-50 text-primary" : "text-neutral-400"}`}
          >
            <GridIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => changeView("list")}
            aria-label={t.listViewAria}
            aria-pressed={view === "list"}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${view === "list" ? "bg-blush-50 text-primary" : "text-neutral-400"}`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative" ref={filterPanelRef}>
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              filtersActive ? "border-primary text-primary" : "border-black/10 text-neutral-600"
            }`}
          >
            <SlidersIcon className="h-4 w-4" /> {t.filtersButton}
          </button>
          {panelOpen && (
            <FilterPanel
              initial={filters}
              viewerGender={viewerGender}
              onApply={applyFilters}
              onClose={() => setPanelOpen(false)}
              dict={dict.filterPanel}
              labels={labels}
            />
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
              <button type="button" onClick={() => removeRegion(region)} aria-label={`${t.removeRegionAria} ${region}`}>
                <CloseIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {viewLimit !== null && (
        <p className="mt-3 text-xs text-neutral-500">{t.viewLimitNote.replace("{limit}", String(viewLimit))}</p>
      )}

      {profiles.length === 0 && !loading ? (
        <div className="mt-14 text-center">
          <p className="text-sm text-neutral-500">{mode === "favorites" ? t.emptyFavorites : t.emptyBrowse}</p>
          {mode === "browse" && filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              {t.clearFilters}
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <MemberCard key={profile.userId} profile={profile} dict={dict.card} labels={labels} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {profiles.map((profile) => (
            <MemberRow key={profile.userId} profile={profile} dict={dict.card} labels={labels} />
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
            {loading ? t.loading : t.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
