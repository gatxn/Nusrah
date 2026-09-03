"use client";

import { useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import { GUARDIAN_RELATIONSHIPS, type GuardianRelationship } from "@/lib/onboarding";
import type { Dictionary } from "@/app/[locale]/dictionaries";
import { ChevronLeftIcon } from "@/components/icons";

export default function GuardianForm({
  initialHasGuardian,
  initialGuardianName,
  initialGuardianRelationship,
  initialGuardianPhone,
  standalone,
  dict,
  labels,
}: {
  initialHasGuardian: boolean;
  initialGuardianName: string | null;
  initialGuardianRelationship: string | null;
  initialGuardianPhone: string | null;
  standalone?: boolean;
  dict: Dictionary["onboarding"];
  labels: Dictionary["common"]["labels"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = dict.guardian;
  const c = dict.common;
  const [justSaved, setJustSaved] = useState(false);
  const [hasGuardian, setHasGuardian] = useState(initialHasGuardian);
  const [guardianName, setGuardianName] = useState(initialGuardianName ?? "");
  const [guardianRelationship, setGuardianRelationship] = useState<GuardianRelationship | "">(
    (initialGuardianRelationship as GuardianRelationship) ?? ""
  );
  const [guardianPhone, setGuardianPhone] = useState(initialGuardianPhone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = !hasGuardian || (guardianName.trim().length >= 2 && !!guardianRelationship && guardianPhone.trim().length >= 9);

  async function save(payload: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    setJustSaved(false);
    try {
      const res = await fetch("/api/onboarding/guardian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue) return;
    save({
      hasGuardian,
      ...(hasGuardian ? { guardianName, guardianRelationship, guardianPhone } : {}),
    });
  }

  function handleSkip() {
    save({ hasGuardian: false });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-navy">{t.pageHeading}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t.pageSubtitle}</p>
      </div>

      <label className="flex items-center justify-between rounded-lg border border-black/10 px-3.5 py-3">
        <span className="text-sm font-medium text-navy">{t.hasGuardianLabel}</span>
        <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
          <input
            type="checkbox"
            checked={hasGuardian}
            onChange={(e) => setHasGuardian(e.target.checked)}
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-black/15 transition-colors peer-checked:bg-primary" />
          <span className="absolute start-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5" />
        </span>
      </label>

      {hasGuardian && (
        <>
          <div>
            <label htmlFor="guardianName" className="mb-1 block text-sm font-medium text-navy">
              {t.guardianNameLabel}
            </label>
            <input
              id="guardianName"
              required
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder={t.guardianNamePlaceholder}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="guardianRelationship" className="mb-1 block text-sm font-medium text-navy">
              {t.relationshipLabel}
            </label>
            <select
              id="guardianRelationship"
              required
              value={guardianRelationship}
              onChange={(e) => setGuardianRelationship(e.target.value as GuardianRelationship)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="" disabled>
                {t.relationshipPlaceholder}
              </option>
              {GUARDIAN_RELATIONSHIPS.map((rel) => (
                <option key={rel} value={rel}>
                  {labels.guardianRelationship[rel]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="guardianPhone" className="mb-1 block text-sm font-medium text-navy">
              {t.guardianPhoneLabel}
            </label>
            <input
              id="guardianPhone"
              required
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              placeholder={t.guardianPhonePlaceholder}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {justSaved && <p className="text-sm font-semibold text-green-700">{c.saved}</p>}

      <div className="flex gap-3">
        {!standalone && (
          <button
            type="button"
            onClick={() => router.push(withLocale(pathname ?? "/", "/onboarding/life"))}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-blush-50"
          >
            <ChevronLeftIcon className="h-4 w-4" /> {c.back}
          </button>
        )}
        {hasGuardian ? (
          <button
            type="submit"
            disabled={loading || !canContinue}
            className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? c.submitting : standalone ? c.save : c.continue}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="flex-1 rounded-full bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-60"
          >
            {loading ? c.submitting : standalone ? c.save : c.skip}
          </button>
        )}
      </div>
    </form>
  );
}
