"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import {
  EDUCATION_LEVELS,
  HEIGHT_OPTIONS_CM,
  BODY_TYPES,
  SKIN_TONES,
  INCOME_RANGES,
  DISABILITY_TYPES,
  INTENTIONS,
  isIntention,
  MIN_AGE,
  MAX_AGE,
  type EducationLevel,
  type BodyType,
  type SkinTone,
  type IncomeRange,
  type DisabilityType,
  type Intention,
} from "@/lib/onboarding";
import type { Dictionary } from "@/app/[locale]/dictionaries";
import { ChevronLeftIcon } from "@/components/icons";

const BIO_MAX = 300;

export default function LifeForm({
  initialOccupation,
  initialEducationLevel,
  initialHeight,
  initialBodyType,
  initialSkinTone,
  initialIncomeRange,
  initialHasDisability,
  initialDisabilityType,
  initialIntentions,
  initialPartnerAgeMin,
  initialPartnerAgeMax,
  initialBio,
  standalone,
  dict,
  labels,
}: {
  initialOccupation: string | null;
  initialEducationLevel: string | null;
  initialHeight: number | null;
  initialBodyType: string | null;
  initialSkinTone: string | null;
  initialIncomeRange: string | null;
  initialHasDisability: boolean | null;
  initialDisabilityType: string | null;
  initialIntentions: string[];
  initialPartnerAgeMin: number | null;
  initialPartnerAgeMax: number | null;
  initialBio: string | null;
  standalone?: boolean;
  dict: Dictionary["onboarding"];
  labels: Dictionary["common"]["labels"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = dict.life;
  const c = dict.common;
  const [justSaved, setJustSaved] = useState(false);
  const [occupation, setOccupation] = useState(initialOccupation ?? "");
  const [educationLevel, setEducationLevel] = useState<EducationLevel | "">(
    (initialEducationLevel as EducationLevel) ?? ""
  );
  const [height, setHeight] = useState(initialHeight ? String(initialHeight) : "");
  const [bodyType, setBodyType] = useState<BodyType | "">((initialBodyType as BodyType) ?? "");
  const [skinTone, setSkinTone] = useState<SkinTone | "">((initialSkinTone as SkinTone) ?? "");
  const [incomeRange, setIncomeRange] = useState<IncomeRange | "">((initialIncomeRange as IncomeRange) ?? "");
  const [hasDisability, setHasDisability] = useState<"NDIYO" | "HAPANA" | "">(
    initialHasDisability === true ? "NDIYO" : initialHasDisability === false ? "HAPANA" : ""
  );
  const [disabilityType, setDisabilityType] = useState<DisabilityType | "">(
    (initialDisabilityType as DisabilityType) ?? ""
  );
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
    (hasDisability !== "NDIYO" || !!disabilityType) &&
    intentions.length > 0 &&
    ageRangeValid &&
    bio.trim().length >= 10;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue) return;
    setLoading(true);
    setError(null);
    setJustSaved(false);

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
          ...(hasDisability
            ? {
                hasDisability: hasDisability === "NDIYO",
                disabilityType: hasDisability === "NDIYO" ? disabilityType : null,
              }
            : {}),
          intentions,
          partnerAgeMin,
          partnerAgeMax,
          bio,
          ...(incomeRange ? { incomeRange } : {}),
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
        <label htmlFor="occupation" className="mb-1 block text-sm font-medium text-navy">
          {t.occupationLabel}
        </label>
        <input
          id="occupation"
          required
          minLength={2}
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder={t.occupationPlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="educationLevel" className="mb-1 block text-sm font-medium text-navy">
          {t.educationLevelLabel}
        </label>
        <select
          id="educationLevel"
          required
          value={educationLevel}
          onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            {t.chooseLevelPlaceholder}
          </option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {labels.educationLevel[level]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="height" className="mb-1 block text-sm font-medium text-navy">
          {t.heightLabel}
        </label>
        <select
          id="height"
          required
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            {t.heightPlaceholder}
          </option>
          {HEIGHT_OPTIONS_CM.map((cm) => (
            <option key={cm} value={cm}>
              {cm} {t.heightUnit}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bodyType" className="mb-1 block text-sm font-medium text-navy">
          {t.bodyTypeLabel}
        </label>
        <select
          id="bodyType"
          required
          value={bodyType}
          onChange={(e) => setBodyType(e.target.value as BodyType)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            {t.choosePlaceholder}
          </option>
          {BODY_TYPES.map((type) => (
            <option key={type} value={type}>
              {labels.bodyType[type]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="hasDisability" className="mb-1 block text-sm font-medium text-navy">
          {t.hasDisabilityLabel}
        </label>
        <select
          id="hasDisability"
          value={hasDisability}
          onChange={(e) => {
            const next = e.target.value as "NDIYO" | "HAPANA" | "";
            setHasDisability(next);
            if (next !== "NDIYO") setDisabilityType("");
          }}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t.choosePlaceholder}</option>
          <option value="NDIYO">{labels.yesNo.NDIYO}</option>
          <option value="HAPANA">{labels.yesNo.HAPANA}</option>
        </select>
      </div>

      {hasDisability === "NDIYO" && (
        <div>
          <label htmlFor="disabilityType" className="mb-1 block text-sm font-medium text-navy">
            {t.disabilityTypeLabel}
          </label>
          <select
            id="disabilityType"
            required
            value={disabilityType}
            onChange={(e) => setDisabilityType(e.target.value as DisabilityType)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              {t.disabilityTypePlaceholder}
            </option>
            {DISABILITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {labels.disabilityType[type]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="skinTone" className="mb-1 block text-sm font-medium text-navy">
          {t.skinToneLabel}
        </label>
        <select
          id="skinTone"
          required
          value={skinTone}
          onChange={(e) => setSkinTone(e.target.value as SkinTone)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            {t.choosePlaceholder}
          </option>
          {SKIN_TONES.map((tone) => (
            <option key={tone} value={tone}>
              {labels.skinTone[tone]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="incomeRange" className="mb-1 block text-sm font-medium text-navy">
          {t.incomeRangeLabel}
        </label>
        <select
          id="incomeRange"
          value={incomeRange}
          onChange={(e) => setIncomeRange(e.target.value as IncomeRange)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t.chooseRangePlaceholder}</option>
          {INCOME_RANGES.map((range) => (
            <option key={range} value={range}>
              {labels.incomeRange[range]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">{t.intentionsLabel}</span>
        <p className="mb-2 text-xs text-neutral-500">{t.intentionsHint}</p>
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
                {labels.intention[intention]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">{t.partnerAgeLabel}</span>
        <div className="flex items-center gap-3">
          <select
            required
            value={partnerAgeMin}
            onChange={(e) => setPartnerAgeMin(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              {t.fromPlaceholder}
            </option>
            {Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span className="text-sm text-neutral-500">{t.toSeparator}</span>
          <select
            required
            value={partnerAgeMax}
            onChange={(e) => setPartnerAgeMax(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              {t.toPlaceholder}
            </option>
            {Array.from({ length: MAX_AGE - MIN_AGE + 1 }, (_, i) => MIN_AGE + i).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {partnerAgeMin && partnerAgeMax && !ageRangeValid && (
          <p className="mt-1.5 text-sm text-red-600">{t.ageRangeInvalid}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="mb-1 block text-sm font-medium text-navy">
          {t.bioLabel}
        </label>
        <textarea
          id="bio"
          required
          rows={4}
          maxLength={BIO_MAX}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t.bioPlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-end text-xs text-neutral-400">
          {bio.length}/{BIO_MAX}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {justSaved && <p className="text-sm font-semibold text-green-700">{c.saved}</p>}

      <div className="flex gap-3">
        {!standalone && (
          <button
            type="button"
            onClick={() => router.push(withLocale(pathname ?? "/", "/onboarding/religion"))}
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
