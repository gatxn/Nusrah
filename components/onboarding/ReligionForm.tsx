"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import {
  RELIGIONS,
  MADHHABS,
  PRAYER_HABITS,
  HIJAB_OPTIONS,
  QURAN_LEVELS,
  SUBSTANCE_USE_OPTIONS,
  type Religion,
  type Madhhab,
  type PrayerHabit,
  type HijabOption,
  type QuranLevel,
  type SubstanceUseOption,
} from "@/lib/onboarding";
import type { Dictionary } from "@/app/[locale]/dictionaries";
import { ChevronLeftIcon } from "@/components/icons";

export default function ReligionForm({
  isFemale,
  initialReligion,
  initialMadhhab,
  initialPrayerHabit,
  initialWearsHijab,
  initialQuranLevel,
  initialSubstanceUse,
  standalone,
  dict,
  labels,
}: {
  isFemale: boolean;
  initialReligion: string | null;
  initialMadhhab: string | null;
  initialPrayerHabit: string | null;
  initialWearsHijab: string | null;
  initialQuranLevel: string | null;
  initialSubstanceUse: string | null;
  standalone?: boolean;
  dict: Dictionary["onboarding"];
  labels: Dictionary["common"]["labels"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = dict.religion;
  const c = dict.common;
  const [justSaved, setJustSaved] = useState(false);
  const [religion, setReligion] = useState<Religion | "">((initialReligion as Religion) ?? "UISLAMU");
  const [madhhab, setMadhhab] = useState<Madhhab | "">((initialMadhhab as Madhhab) ?? "");
  const [prayerHabit, setPrayerHabit] = useState<PrayerHabit | "">((initialPrayerHabit as PrayerHabit) ?? "");
  const [wearsHijab, setWearsHijab] = useState<HijabOption | "">((initialWearsHijab as HijabOption) ?? "");
  const [quranLevel, setQuranLevel] = useState<QuranLevel | "">((initialQuranLevel as QuranLevel) ?? "");
  const [substanceUse, setSubstanceUse] = useState<SubstanceUseOption | "">(
    (initialSubstanceUse as SubstanceUseOption) ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMuslim = religion === "UISLAMU";

  function handleReligionChange(next: Religion) {
    setReligion(next);
    if (next !== "UISLAMU") {
      setMadhhab("");
      setPrayerHabit("");
      setQuranLevel("");
      setWearsHijab("");
    }
  }

  const canContinue =
    !!religion &&
    !!substanceUse &&
    (!isMuslim || (!!madhhab && !!prayerHabit && !!quranLevel && (!isFemale || !!wearsHijab)));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue) return;
    setLoading(true);
    setError(null);
    setJustSaved(false);

    try {
      const res = await fetch("/api/onboarding/religion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          religion,
          substanceUse,
          ...(isMuslim ? { madhhab, prayerHabit, quranLevel } : {}),
          ...(isMuslim && isFemale ? { wearsHijab } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? c.genericError);
        setLoading(false);
        return;
      }
      if (standalone) {
        setJustSaved(true);
        setLoading(false);
      } else {
        router.push(withLocale(pathname ?? "/", json.nextStep));
      }
    } catch {
      setError(c.networkError);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="religion" className="mb-1 block text-sm font-medium text-navy">
          {t.religionLabel}
        </label>
        <select
          id="religion"
          required
          value={religion}
          onChange={(e) => handleReligionChange(e.target.value as Religion)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            {t.religionPlaceholder}
          </option>
          {RELIGIONS.map((r) => (
            <option key={r} value={r}>
              {labels.religion[r]}
            </option>
          ))}
        </select>
      </div>

      {isMuslim && (
        <>
          <div>
            <label htmlFor="madhhab" className="mb-1 block text-sm font-medium text-navy">
              {t.madhhabLabel}
            </label>
            <select
              id="madhhab"
              required
              value={madhhab}
              onChange={(e) => setMadhhab(e.target.value as Madhhab)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="" disabled>
                {t.madhhabPlaceholder}
              </option>
              {MADHHABS.map((m) => (
                <option key={m} value={m}>
                  {labels.madhhab[m]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prayerHabit" className="mb-1 block text-sm font-medium text-navy">
              {t.prayerHabitLabel}
            </label>
            <select
              id="prayerHabit"
              required
              value={prayerHabit}
              onChange={(e) => setPrayerHabit(e.target.value as PrayerHabit)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="" disabled>
                {t.choosePlaceholder}
              </option>
              {PRAYER_HABITS.map((p) => (
                <option key={p} value={p}>
                  {labels.prayerHabit[p]}
                </option>
              ))}
            </select>
          </div>

          {isFemale && (
            <div>
              <label htmlFor="wearsHijab" className="mb-1 block text-sm font-medium text-navy">
                {t.wearsHijabLabel}
              </label>
              <select
                id="wearsHijab"
                required
                value={wearsHijab}
                onChange={(e) => setWearsHijab(e.target.value as HijabOption)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  {t.choosePlaceholder}
                </option>
                {HIJAB_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {labels.hijabOption[h]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="quranLevel" className="mb-1 block text-sm font-medium text-navy">
              {t.quranLevelLabel}
            </label>
            <select
              id="quranLevel"
              required
              value={quranLevel}
              onChange={(e) => setQuranLevel(e.target.value as QuranLevel)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="" disabled>
                {t.quranLevelPlaceholder}
              </option>
              {QURAN_LEVELS.map((q) => (
                <option key={q} value={q}>
                  {labels.quranLevel[q]}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <label htmlFor="substanceUse" className="mb-1 block text-sm font-medium text-navy">
          {t.substanceUseLabel}
        </label>
        <select
          id="substanceUse"
          required
          value={substanceUse}
          onChange={(e) => setSubstanceUse(e.target.value as SubstanceUseOption)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            {t.choosePlaceholder}
          </option>
          {SUBSTANCE_USE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {labels.substanceUse[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {justSaved && <p className="text-sm font-semibold text-green-700">{c.saved}</p>}

      <div className="flex gap-3">
        {!standalone && (
          <button
            type="button"
            onClick={() => router.push(withLocale(pathname ?? "/", "/onboarding/personal"))}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-blush-50"
          >
            <ChevronLeftIcon className="h-4 w-4" /> {c.back}
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !canContinue}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? c.submitting : standalone ? c.save : c.continue}
        </button>
      </div>
    </form>
  );
}
