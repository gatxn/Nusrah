"use client";

import { useState } from "react";
import { TANZANIA_REGIONS } from "@/lib/geo";
import { MIN_AGE, MAX_AGE, MARITAL_STATUSES, MADHHABS, HIJAB_OPTIONS, INTENTIONS } from "@/lib/onboarding";
import { CloseIcon, ShieldCheckIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export type AppliedFilters = {
  minAge: number;
  maxAge: number;
  regions: string[];
  maritalStatuses: string[];
  madhhabs: string[];
  hijab: string[];
  intentions: string[];
  verifiedOnly: boolean;
};

export const DEFAULT_FILTERS: AppliedFilters = {
  minAge: MIN_AGE,
  maxAge: MAX_AGE,
  regions: [],
  maritalStatuses: [],
  madhhabs: [],
  hijab: [],
  intentions: [],
  verifiedOnly: false,
};

function PillGroup({
  title,
  options,
  labels,
  selected,
  onToggle,
}: {
  title: string;
  options: readonly string[];
  labels: Record<string, string>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold text-neutral-600">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((value) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active ? "border-primary bg-blush-50 text-primary" : "border-black/10 text-neutral-600"
              }`}
            >
              {labels[value]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterPanel({
  initial,
  viewerGender,
  onApply,
  onClose,
  dict,
  labels,
}: {
  initial: AppliedFilters;
  viewerGender?: string | null;
  onApply: (filters: AppliedFilters) => void;
  onClose: () => void;
  dict: Dictionary["wanachama"]["filterPanel"];
  labels: Dictionary["common"]["labels"];
}) {
  const [minAge, setMinAge] = useState(initial.minAge);
  const [maxAge, setMaxAge] = useState(initial.maxAge);
  const [regions, setRegions] = useState<string[]>(initial.regions);
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>(initial.maritalStatuses);
  const [madhhabs, setMadhhabs] = useState<string[]>(initial.madhhabs);
  const [hijab, setHijab] = useState<string[]>(initial.hijab);
  const [intentions, setIntentions] = useState<string[]>(initial.intentions);
  const [verifiedOnly, setVerifiedOnly] = useState(initial.verifiedOnly);

  const allSelected = regions.length === TANZANIA_REGIONS.length;

  function toggleRegion(region: string) {
    setRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }

  function toggleAll() {
    setRegions(allSelected ? [] : [...TANZANIA_REGIONS]);
  }

  function toggleIn(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    return (value: string) =>
      setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function apply() {
    onApply({
      minAge: Math.min(minAge, maxAge),
      maxAge: Math.max(minAge, maxAge),
      regions,
      maritalStatuses,
      madhhabs,
      hijab,
      intentions,
      verifiedOnly,
    });
    onClose();
  }

  function clear() {
    setMinAge(MIN_AGE);
    setMaxAge(MAX_AGE);
    setRegions([]);
    setMaritalStatuses([]);
    setMadhhabs([]);
    setHijab([]);
    setIntentions([]);
    setVerifiedOnly(false);
    onApply(DEFAULT_FILTERS);
    onClose();
  }

  return (
    <div className="absolute right-0 top-full z-20 mt-2 w-[min(92vw,380px)] rounded-2xl border border-black/5 bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy">{dict.heading}</h2>
        <button type="button" onClick={onClose} aria-label={dict.closeAria} className="text-neutral-400 hover:text-navy">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto pe-1">
      <div>
        <p className="mb-2 text-xs font-semibold text-neutral-600">{dict.ageLabel}</p>
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
          <p className="text-xs font-semibold text-neutral-600">{dict.regionLabel}</p>
          <button type="button" onClick={toggleAll} className="text-xs font-semibold text-primary hover:underline">
            {allSelected ? dict.deselectAll : dict.selectAll}
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

      <PillGroup
        title={dict.intentionsTitle}
        options={INTENTIONS}
        labels={labels.intention}
        selected={intentions}
        onToggle={toggleIn(setIntentions)}
      />
      <PillGroup
        title={dict.maritalStatusTitle}
        options={MARITAL_STATUSES}
        labels={labels.maritalStatus}
        selected={maritalStatuses}
        onToggle={toggleIn(setMaritalStatuses)}
      />
      <PillGroup
        title={dict.madhhabTitle}
        options={MADHHABS}
        labels={labels.madhhab}
        selected={madhhabs}
        onToggle={toggleIn(setMadhhabs)}
      />
      {viewerGender === "MALE" && (
        <PillGroup
          title={dict.hijabTitle}
          options={HIJAB_OPTIONS}
          labels={labels.hijabOption}
          selected={hijab}
          onToggle={toggleIn(setHijab)}
        />
      )}

      <div className="mt-4 border-t border-black/5 pt-4">
        <label className="flex items-start gap-2.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-primary focus:ring-primary"
          />
          <span className="flex items-center gap-1.5">
            <ShieldCheckIcon className="h-4 w-4 text-primary" /> {dict.verifiedOnlyLabel}
          </span>
        </label>
        <p className="mt-1 ps-6 text-xs text-neutral-500">{dict.verifiedOnlyHint}</p>
      </div>
      </div>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-blush-50"
        >
          {dict.clear}
        </button>
        <button
          type="button"
          onClick={apply}
          className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          {dict.apply}
        </button>
      </div>
    </div>
  );
}
