"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  MADHHABS,
  MADHHAB_LABELS,
  PRAYER_HABITS,
  PRAYER_HABIT_LABELS,
  HIJAB_OPTIONS,
  HIJAB_OPTION_LABELS,
  QURAN_LEVELS,
  QURAN_LEVEL_LABELS,
  SUBSTANCE_USE_OPTIONS,
  SUBSTANCE_USE_LABELS,
  type Madhhab,
  type PrayerHabit,
  type HijabOption,
  type QuranLevel,
  type SubstanceUseOption,
} from "@/lib/onboarding";
import { ChevronLeftIcon } from "@/components/icons";

export default function ReligionForm({
  isFemale,
  initialReligion,
  initialMadhhab,
  initialPrayerHabit,
  initialWearsHijab,
  initialQuranLevel,
  initialSubstanceUse,
}: {
  isFemale: boolean;
  initialReligion: string | null;
  initialMadhhab: string | null;
  initialPrayerHabit: string | null;
  initialWearsHijab: string | null;
  initialQuranLevel: string | null;
  initialSubstanceUse: string | null;
}) {
  const router = useRouter();
  const [religion, setReligion] = useState(initialReligion ?? "Islam");
  const [madhhab, setMadhhab] = useState<Madhhab | "">((initialMadhhab as Madhhab) ?? "");
  const [prayerHabit, setPrayerHabit] = useState<PrayerHabit | "">((initialPrayerHabit as PrayerHabit) ?? "");
  const [wearsHijab, setWearsHijab] = useState<HijabOption | "">((initialWearsHijab as HijabOption) ?? "");
  const [quranLevel, setQuranLevel] = useState<QuranLevel | "">((initialQuranLevel as QuranLevel) ?? "");
  const [substanceUse, setSubstanceUse] = useState<SubstanceUseOption | "">(
    (initialSubstanceUse as SubstanceUseOption) ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue =
    religion.trim().length >= 2 &&
    !!madhhab &&
    !!prayerHabit &&
    !!quranLevel &&
    !!substanceUse &&
    (!isFemale || !!wearsHijab);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/religion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          religion,
          madhhab,
          prayerHabit,
          quranLevel,
          substanceUse,
          ...(isFemale ? { wearsHijab } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Hitilafu imetokea");
        setLoading(false);
        return;
      }
      router.push(json.nextStep);
    } catch {
      setError("Imeshindwa kuunganisha na seva. Jaribu tena.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="religion" className="mb-1 block text-sm font-medium text-navy">
          Dini
        </label>
        <input
          id="religion"
          required
          value={religion}
          onChange={(e) => setReligion(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="madhhab" className="mb-1 block text-sm font-medium text-navy">
          Madhhabu
        </label>
        <select
          id="madhhab"
          required
          value={madhhab}
          onChange={(e) => setMadhhab(e.target.value as Madhhab)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua madhhabu yako
          </option>
          {MADHHABS.map((m) => (
            <option key={m} value={m}>
              {MADHHAB_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="prayerHabit" className="mb-1 block text-sm font-medium text-navy">
          Unaswali?
        </label>
        <select
          id="prayerHabit"
          required
          value={prayerHabit}
          onChange={(e) => setPrayerHabit(e.target.value as PrayerHabit)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua
          </option>
          {PRAYER_HABITS.map((p) => (
            <option key={p} value={p}>
              {PRAYER_HABIT_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {isFemale && (
        <div>
          <label htmlFor="wearsHijab" className="mb-1 block text-sm font-medium text-navy">
            Unavaa Hijab?
          </label>
          <select
            id="wearsHijab"
            required
            value={wearsHijab}
            onChange={(e) => setWearsHijab(e.target.value as HijabOption)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              Chagua
            </option>
            {HIJAB_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {HIJAB_OPTION_LABELS[h]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="quranLevel" className="mb-1 block text-sm font-medium text-navy">
          Kusoma Qur&apos;an
        </label>
        <select
          id="quranLevel"
          required
          value={quranLevel}
          onChange={(e) => setQuranLevel(e.target.value as QuranLevel)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua kiwango chako
          </option>
          {QURAN_LEVELS.map((q) => (
            <option key={q} value={q}>
              {QURAN_LEVEL_LABELS[q]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="substanceUse" className="mb-1 block text-sm font-medium text-navy">
          Unatumia pombe/uvutaji?
        </label>
        <select
          id="substanceUse"
          required
          value={substanceUse}
          onChange={(e) => setSubstanceUse(e.target.value as SubstanceUseOption)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua
          </option>
          {SUBSTANCE_USE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {SUBSTANCE_USE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/onboarding/personal")}
          className="flex items-center gap-1.5 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-blush-50"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Rudi Nyuma
        </button>
        <button
          type="submit"
          disabled={loading || !canContinue}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? "Inaendelea..." : "Endelea"}
        </button>
      </div>
    </form>
  );
}
