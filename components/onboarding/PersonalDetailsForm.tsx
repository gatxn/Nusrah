"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAge } from "@/lib/dates";
import { MIN_AGE, MARITAL_STATUSES, MARITAL_STATUS_LABELS, type MaritalStatus } from "@/lib/onboarding";
import { COUNTRIES, TANZANIA_REGIONS, codeToFlagEmoji, findCountryByCode, findCountryByName } from "@/lib/geo";

const GENDER_LABELS: Record<string, string> = { FEMALE: "Mwanamke", MALE: "Mwanaume" };

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
}: {
  name: string;
  gender: string | null;
  initialDisplayName: string | null;
  initialDob: Date | null;
  initialCountry: string | null;
  initialRegion: string | null;
  initialCity: string | null;
  initialMaritalStatus: string | null;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [dob, setDob] = useState(toDateInputValue(initialDob));
  const defaultCountry = initialCountry ? findCountryByCode(initialCountry) : undefined;
  const [countryName, setCountryName] = useState(defaultCountry?.name ?? "Tanzania");
  const [region, setRegion] = useState(initialRegion ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | "">(
    (initialMaritalStatus as MaritalStatus) ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchedCountry = useMemo(() => findCountryByName(countryName), [countryName]);
  const isTanzania = matchedCountry?.code === "TZ";

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
    !!matchedCountry &&
    region.trim().length >= 2 &&
    city.trim().length >= 2 &&
    !!maritalStatus;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue || !matchedCountry) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          dob,
          country: matchedCountry.code,
          region,
          city,
          maritalStatus,
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
        <span className="mb-1 block text-sm font-medium text-navy">Jina Kamili</span>
        <p className="w-full rounded-lg border border-black/5 bg-blush-50 px-3 py-2 text-sm text-neutral-600">
          {name}
        </p>
      </div>

      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-navy">
          Jina Unalotaka Kuonekana
        </label>
        <input
          id="displayName"
          required
          minLength={2}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jina lako la kuonekana kwenye profaili"
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-navy">Jinsia</span>
        <p className="w-full rounded-lg border border-black/5 bg-blush-50 px-3 py-2 text-sm text-neutral-600">
          {gender ? (GENDER_LABELS[gender] ?? gender) : "—"}
        </p>
      </div>

      <div>
        <label htmlFor="dob" className="mb-1 block text-sm font-medium text-navy">
          Tarehe ya Kuzaliwa
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
          <p className={`mt-1.5 text-sm ${underMinAge ? "text-red-600" : "text-neutral-600"}`}>Umri: {age}</p>
        )}
      </div>

      <div>
        <label htmlFor="country" className="mb-1 block text-sm font-medium text-navy">
          Nchi
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {matchedCountry ? codeToFlagEmoji(matchedCountry.code) : "🏳️"}
          </span>
          <input
            id="country"
            list="country-options"
            required
            value={countryName}
            onChange={(e) => {
              setCountryName(e.target.value);
              setRegion("");
            }}
            placeholder="Chagua au andika nchi"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <datalist id="country-options">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label htmlFor="region" className="mb-1 block text-sm font-medium text-navy">
          Eneo Unaloishi (Mkoa)
        </label>
        {isTanzania ? (
          <select
            id="region"
            required
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="" disabled>
              Chagua mkoa/jiji lako
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
            placeholder="Mkoa / Jimbo"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        )}
      </div>

      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium text-navy">
          Wilaya / Eneo la Makazi
        </label>
        <input
          id="city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Chagua wilaya/eneo lako"
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="maritalStatus" className="mb-1 block text-sm font-medium text-navy">
          Hali ya Ndoa
        </label>
        <select
          id="maritalStatus"
          required
          value={maritalStatus}
          onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="" disabled>
            Chagua hali yako ya ndoa
          </option>
          {MARITAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {MARITAL_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {underMinAge && (
        <p className="text-sm text-red-600">Lazima uwe na umri wa miaka {MIN_AGE} au zaidi kutumia Nusrah.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !canContinue}
        className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? "Inaendelea..." : "Endelea"}
      </button>
    </form>
  );
}
