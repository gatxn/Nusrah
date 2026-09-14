"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";

type SearchResult = {
  users: { userId: string; name: string; phone: string; email: string | null }[];
  reports: { id: string; reason: string; reportedUserName: string }[];
};

const DEBOUNCE_MS = 300;

export default function GlobalSearchBox() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = value.trim();
    if (q.length < 2) {
      setResult(null);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setOpen(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (res.ok) setResult(json);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  const hasResults = !!result && (result.users.length > 0 || result.reports.length > 0);

  return (
    <div className="relative min-w-0 flex-1 max-w-md" ref={containerRef}>
      <div className="relative">
        <span className="absolute inset-y-0 start-0 flex w-9 items-center justify-center text-neutral-400">
          <SearchIcon className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search users, reports…"
          className="w-full rounded-full border border-black/10 bg-blush-50/60 py-2 ps-9 pe-3 text-sm focus:border-primary focus:bg-white focus:outline-none"
        />
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-full min-w-72 rounded-2xl border border-black/5 bg-white p-3 shadow-lg">
          {loading && !result ? (
            <p className="px-2 py-4 text-center text-sm text-neutral-500">Searching…</p>
          ) : !hasResults ? (
            <p className="px-2 py-4 text-center text-sm text-neutral-500">No results.</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {result!.users.length > 0 && (
                <div>
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    Users
                  </p>
                  <ul className="space-y-0.5">
                    {result!.users.map((u) => (
                      <li key={u.userId}>
                        <Link
                          href={`/admin/users/${u.userId}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-navy transition hover:bg-blush-50"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className="ms-2 text-neutral-500">{u.phone}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result!.reports.length > 0 && (
                <div>
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    Reports
                  </p>
                  <ul className="space-y-0.5">
                    {result!.reports.map((r) => (
                      <li key={r.id}>
                        <Link
                          href={`/admin/reports/${r.id}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-navy transition hover:bg-blush-50"
                        >
                          <span className="font-medium">{r.reason}</span>
                          <span className="ms-2 text-neutral-500">vs. {r.reportedUserName}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
