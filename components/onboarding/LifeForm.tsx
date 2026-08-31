"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  EDUCATION_LEVELS,
  EDUCATION_LEVEL_LABELS,
  HEIGHT_OPTIONS_CM,
  BODY_TYPES,
  BODY_TYPE_LABELS,
  SKIN_TONES,
  SKIN_TONE_LABELS,
  INCOME_RANGES,
  INCOME_RANGE_LABELS,
  INTENTIONS,
  INTENTION_LABELS,
  isIntention,
  MIN_AGE,
  MAX_AGE,
  type EducationLevel,
  type BodyType,
  type SkinTone,
  type IncomeRange,
  type Intention,
} from "@/lib/onboarding";
import { ChevronLeftIcon } from "@/components/icons";

const BIO_MAX = 300;

export default function LifeForm({
  initialOccupation,
  initialEducationLevel,
  initialHeight,
  initialBodyType,
  initialSkinTone,
  initialIncomeRange,
  initialIntentions,
  initialPartnerAgeMin,
  initialPartnerAgeMax,
  initialBio,
}: {
  initialOccupation: string | null;
  initialEducationLevel: string | null;
  initialHeight: number | null;
  initialBodyType: string | null;
  initialSkinTone: string | null;
  initialIncomeRange: string | null;
  initialIntentions: string[];
  initialPartnerAgeMin: number | null;
  initialPartnerAgeMax: number | null;
  initialBio: string | null;
}) {
  const router = useRouter();
  const [occupation, setOccupation] = useState(initialOccupation ?? "");
  const [educationLevel, setEducationLevel] = useState<EducationLevel | "">(
    (initialEducationLevel as EducationLevel) ?? ""
  );
  const [height, setHeight] = useState(initialHeight ? String(initialHeight) : "");
  const [bodyType, setBodyType] = useState<BodyType | "">((initialBodyType as BodyType) ?? "");
  const [skinTone, setSkinTone] = useState<SkinTone | "">((initialSkinTone as SkinTone) ?? "");
  const [incomeRange, setIncomeRange] = useState<IncomeRange | "">((initialIncomeRange as IncomeRange) ?? "");
  const [intentions, setIntentions] = useState<Intention[]>(initialIntentions.filter(isIntention));
  const [partnerAgeMin, setPartnerAgeMin] = useState(initialPartnerAgeMin ? String(initialPartnerAgeMin) : "");
  const [partnerAgeMax, setPartnerAgeMax] = useState(initialPartnerAgeMax ? String(initialPartnerAgeMax) : "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleIntention(intention: Intention) {
    setIntentions((prev) =>
      prev.includes(intention) ? prev.filter((i) => i !== intention) : [...prev, intention]
    );
  }

  const minAgeNum = Number(partnerAgeMin);
  const maxAgeNum = Number(partnerAgeMax);
  const ageRangeValid =
    partnerAgeMin.length > 0 &&
    partnerAgeMax.length > 0 &&
    minAgeNum >= MIN_AGE &&
    maxAgeNum <= MAX_AGE &&
    minAgeNum <= maxAgeNum;

  const canContinue =
    occupation.trim().length >= 2 &&
    !!educationLevel &&
    !!height &&
    !!bodyType &&
    !!skinTone &&
    intentions.length > 0 &&
    ageRangeValid &&
    bio.trim().length >= 10;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupation,
          educationLevel,
          height,
          bodyType,
          skinTone,
          intentions,
          partnerAgeMin,
          partnerAgeMax,
          bio,
          ...(incomeRange ? { incomeRange } : {}),
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
        <label htmlFor="occupation" className="mb-1 block text-sm font-medium text-navy">
          Kazi / Shughuli Yako
        </label>
        <input
          id="occupation"
          required
          minLength={2}
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder="Eleza kazi yako"
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="educationLevel" className="mb-1 block text-sm font-medium text-navy">
          Elimu ya Juu
        </label>
        <select
          id="educationLevel"
          required
          value={educationLevel}
          onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua kiwango chako
          </option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {EDUCATION_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="height" className="mb-1 block text-sm font-medium text-navy">
          Urefu (sm)
        </label>
        <select
          id="height"
          required
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua urefu wako
          </option>
          {HEIGHT_OPTIONS_CM.map((cm) => (
            <option key={cm} value={cm}>
              {cm} sm
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bodyType" className="mb-1 block text-sm font-medium text-navy">
          Aina ya Mwili
        </label>
        <select
          id="bodyType"
          required
          value={bodyType}
          onChange={(e) => setBodyType(e.target.value as BodyType)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua
          </option>
          {BODY_TYPES.map((type) => (
            <option key={type} value={type}>
              {BODY_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="skinTone" className="mb-1 block text-sm font-medium text-navy">
          Rangi ya Ngozi
        </label>
        <select
          id="skinTone"
          required
          value={skinTone}
          onChange={(e) => setSkinTone(e.target.value as SkinTone)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua
          </option>
          {SKIN_TONES.map((tone) => (
            <option key={tone} value={tone}>
              {SKIN_TONE_LABELS[tone]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="incomeRange" className="mb-1 block text-sm font-medium text-navy">
          Kipato (Kama Unataka)
        </label>
        <select
          id="incomeRange"
          value={incomeRange}
          onChange={(e) => setIncomeRange(e.target.value as IncomeRange)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Chagua kiwango</option>
          {INCOME_RANGES.map((range) => (
            <option key={range} value={range}>
              {INCOME_RANGE_LABELS[range]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">Unatafuta</span>
        <p className="mb-2 text-xs text-neutral-500">Unaweza kuchagua zaidi ya chaguo moja.</p>
        <div className="flex flex-wrap gap-2.5">
          {INTENTIONS.map((intention) => {
            const active = intentions.includes(intention);
            return (
              <button
                key={intention}
                type="button"
                onClick={() => toggleIntention(intention)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active ? "border-primary bg-blush-50 text-primary" : "border-black/10 text-neutral-600"
                }`}
              >
                {INTENTION_LABELS[intention]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">Umri wa Mwenza Unayetaka</span>
        <div className="flex items-center gap-3">
          <select
            required
            value={partnerAgeMin}
            onChange={(e) => setPartnerAgeMin(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              Kutoka
            </option>
            {Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span className="text-sm text-neutral-500">hadi</span>
          <select
            required
            value={partnerAgeMax}
            onChange={(e) => setPartnerAgeMax(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              Hadi
            </option>
            {Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {partnerAgeMin && partnerAgeMax && !ageRangeValid && (
          <p className="mt-1.5 text-sm text-red-600">Umri wa chini hauwezi kuzidi umri wa juu</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-navy">
          Maelezo Mafupi Kuhusu Wewe
        </label>
        <textarea
          id="bio"
          required
          rows={4}
          maxLength={BIO_MAX}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Eleza kwa ufupi kuhusu wewe, malengo yako na unachotafuta kwa mwenza wako..."
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-end text-xs text-neutral-400">
          {bio.length}/{BIO_MAX}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/onboarding/religion")}
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
