"use client";

import { useState } from "react";
import { TANZANIA_REGIONS } from "@/lib/geo";
import { MIN_AGE, MAX_AGE } from "@/lib/onboarding";
import { CloseIcon } from "@/components/icons";

export type AppliedFilters = {
  minAge: number;
  maxAge: number;
  regions: string[];
};

export default function FilterPanel({
  initial,
  onApply,
  onClose,
}: {
  initial: AppliedFilters;
  onApply: (filters: AppliedFilters) => void;
  onClose: () => void;
}) {
  const [minAge, setMinAge] = useState(initial.minAge);
  const [maxAge, setMaxAge] = useState(initial.maxAge);
  const [regions, setRegions] = useState<string[]>(initial.regions);

  const allSelected = regions.length === TANZANIA_REGIONS.length;

  function toggleRegion(region: string) {
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  function toggleAll() {
    setRegions(allSelected ? [] : [...TANZANIA_REGIONS]);
  }

  function apply() {
    onApply({
      minAge: Math.min(minAge, maxAge),
      maxAge: Math.max(minAge, maxAge),
      regions,
    });
    onClose();
  }

  function clear() {
    setMinAge(MIN_AGE);
    setMaxAge(MAX_AGE);
    setRegions([]);
    onApply({ minAge: MIN_AGE, maxAge: MAX_AGE, regions: [] });
    onClose();
  }

  return (
    <div className="absolute right-0 top-full z-20 mt-2 w-[min(92vw,380px)] rounded-2xl border border-black/5 bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy">Vigezo vya Utafutaji</h2>
        <button type="button" onClick={onClose} aria-label="Funga" className="text-neutral-400 hover:text-navy">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-neutral-600">Umri</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={MIN_AGE}
            max={MAX_AGE}
            value={minAge}
            onChange={(e) => setMinAge(Number(e.target.value) || MIN_AGE)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <span className="text-neutral-400">—</span>
          <input
            type="number"
            min={MIN_AGE}
            max={MAX_AGE}
            value={maxAge}
            onChange={(e) => setMaxAge(Number(e.target.value) || MAX_AGE)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-600">Mkoa</p>
          <button type="button" onClick={toggleAll} className="text-xs font-semibold text-primary hover:underline">
            {allSelected ? "Ondoa Zote" : "Chagua Zote"}
          </button>
        </div>
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {TANZANIA_REGIONS.map((region) => {
            const active = regions.includes(region);
            return (
              <button
                key={region}
                type="button"
                onClick={() => toggleRegion(region)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active ? "border-primary bg-blush-50 text-primary" : "border-black/10 text-neutral-600"
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-blush-50"
        >
          Futa Vigezo
        </button>
        <button
          type="button"
          onClick={apply}
          className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Tumia Vigezo
        </button>
      </div>
    </div>
  );
}
