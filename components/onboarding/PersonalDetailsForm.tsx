"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAge } from "@/lib/dates";
import { MIN_AGE, MARITAL_STATUSES, type MaritalStatus } from "@/lib/onboarding";
import { TANZANIA_REGIONS, TANZANIA_DISTRICTS_BY_REGION, findCountryByCode, type Country } from "@/lib/geo";
import { withLocale } from "@/lib/i18n/href";
import CountrySearchSelect from "@/components/onboarding/CountrySearchSelect";
import type { Dictionary } from "@/app/[locale]/dictionaries";

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default function PersonalDetailsForm({
  name,
  gender,
  initialDisplayName,
  initialDob,
  initialCountry,
  initialRegion,
  initialCity,
  initialMaritalStatus,
  initialTribe,
  standalone,
  dict,
  labels,
}: {
  name: string;
  gender: string | null;
  initialDisplayName: string | null;
  initialDob: Date | null;
  initialCountry: string | null;
  initialRegion: string | null;
  initialCity: string | null;
  initialMaritalStatus: string | null;
  initialTribe: string | null;
  // True in My Profile (Wasifu Wangu) — shows inline "Imehifadhiwa" feedback
  // instead of the wizard's next-step navigation. A plain boolean (not a
  // callback) since this component is rendered from a Server Component page
  // and a function prop can't cross that boundary.
  standalone?: boolean;
  dict: Dictionary["onboarding"];
  labels: Dictionary["common"]["labels"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = dict.personal;
  const c = dict.common;
  const [justSaved, setJustSaved] = useState(false);
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [dob, setDob] = useState(toDateInputValue(initialDob));
  const defaultCountry = initialCountry ? findCountryByCode(initialCountry) : findCountryByCode("TZ");
  const [country, setCountry] = useState<Country | undefined>(defaultCountry);
  const [region, setRegion] = useState(initialRegion ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | "">(
    (initialMaritalStatus as MaritalStatus) ?? ""
  );
  const [tribe, setTribe] = useState(initialTribe ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTanzania = country?.code === "TZ";
  const districtOptions = isTanzania ? (TANZANIA_DISTRICTS_BY_REGION[region] ?? []) : [];

  const age = useMemo(() => {
    if (!dob) return null;
    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) return null;
    return getAge(parsed);
  }, [dob]);

  const underMinAge = age !== null && age < MIN_AGE;
  const canContinue =
    displayName.trim().length >= 2 &&
    dob.length > 0 &&
    age !== null &&
    !underMinAge &&
    !!country &&
    region.trim().length >= 2 &&
    city.trim().length >= 2 &&
    !!maritalStatus;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue || !country) return;
    setLoading(true);
    setError(null);
    setJustSaved(false);

    try {
      const res = await fetch("/api/onboarding/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          dob,
          country: country.code,
          region,
          city,
          maritalStatus,
          tribe: isTanzania ? tribe : "",
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
        <span className="mb-1 block text-sm font-medium text-navy">{t.fullName}</span>
        <p className="w-full rounded-lg border border-black/5 bg-blush-50 px-3 py-2 text-sm text-neutral-600">
          {name}
        </p>
      </div>

      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-navy">
          {t.displayNameLabel}
        </label>
        <input
          id="displayName"
          required
          minLength={2}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t.displayNamePlaceholder}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">{t.genderLabel}</span>
        <p className="w-full rounded-lg border border-black/5 bg-blush-50 px-3 py-2 text-sm text-neutral-600">
          {gender ? (gender === "FEMALE" ? t.genderFemale : gender === "MALE" ? t.genderMale : gender) : "—"}
        </p>
      </div>

      <div>
        <label htmlFor="dob" className="mb-1 block text-sm font-medium text-navy">
          {t.dobLabel}
        </label>
        <input
          id="dob"
          name="dob"
          type="date"
          required
          value={dob}
          max={toDateInputValue(new Date())}
          onChange={(e) => setDob(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {age !== null && (
          <p className={`mt-1.5 text-sm ${underMinAge ? "text-red-600" : "text-neutral-600"}`}>
            {t.ageLabel}: {age}
          </p>
        )}
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">{t.countryLabel}</span>
        <CountrySearchSelect
          value={country}
          onChange={(c) => {
            setCountry(c);
            setRegion("");
            setCity("");
          }}
          placeholder={t.countryPlaceholder}
          searchPlaceholder={t.countrySearchPlaceholder}
          noResultsText={t.countryNoResults}
        />
      </div>

      <div>
        <label htmlFor="region" className="mb-1 block text-sm font-medium text-navy">
          {t.regionLabel}
        </label>
        {isTanzania ? (
          <select
            id="region"
            required
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setCity("");
            }}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              {t.regionSelectPlaceholder}
            </option>
            {TANZANIA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="region"
            required
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder={t.regionInputPlaceholder}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        )}
      </div>

      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium text-navy">
          {t.cityLabel}
        </label>
        {isTanzania ? (
          <select
            id="city"
            required
            disabled={!region}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-blush-50 disabled:text-neutral-400"
          >
            <option value="" disabled>
              {t.citySelectPlaceholder}
            </option>
            {districtOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t.cityInputPlaceholder}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        )}
      </div>

      {isTanzania && (
        <div>
          <label htmlFor="tribe" className="mb-1 block text-sm font-medium text-navy">
            {t.tribeLabel}
          </label>
          <input
            id="tribe"
            value={tribe}
            onChange={(e) => setTribe(e.target.value)}
            placeholder={t.tribePlaceholder}
            maxLength={80}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      )}

      <div>
        <label htmlFor="maritalStatus" className="mb-1 block text-sm font-medium text-navy">
          {t.maritalStatusLabel}
        </label>
        <select
          id="maritalStatus"
          required
          value={maritalStatus}
          onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            {t.maritalStatusPlaceholder}
          </option>
          {MARITAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {labels.maritalStatus[status]}
            </option>
          ))}
        </select>
      </div>

      {underMinAge && <p className="text-sm text-red-600">{t.underMinAge.replace("{minAge}", String(MIN_AGE))}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {justSaved && <p className="text-sm font-semibold text-green-700">{c.saved}</p>}

      <button
        type="submit"
        disabled={loading || !canContinue}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? c.submitting : standalone ? c.save : c.continue}
      </button>
    </form>
  );
}
