"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, TANZANIA_REGIONS, codeToFlagEmoji, findCountryByCode, findCountryByName } from "@/lib/geo";
import { ChevronLeftIcon } from "@/components/icons";

export default function AddressForm({
  initialCountry,
  initialRegion,
  initialCity,
}: {
  initialCountry: string | null;
  initialRegion: string | null;
  initialCity: string | null;
}) {
  const router = useRouter();
  const defaultCountry = initialCountry ? findCountryByCode(initialCountry) : undefined;
  const [countryName, setCountryName] = useState(defaultCountry?.name ?? "Tanzania");
  const [region, setRegion] = useState(initialRegion ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchedCountry = useMemo(() => findCountryByName(countryName), [countryName]);
  const isTanzania = matchedCountry?.code === "TZ";
  const canContinue = !!matchedCountry && region.trim().length >= 2 && city.trim().length >= 2;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!matchedCountry) {
      setError("Chagua nchi kutoka kwenye orodha");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: matchedCountry.code, region, city }),
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
          Mkoa
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
              Chagua mkoa
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
          Jiji / Mji
        </label>
        <input
          id="city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Mfano: Dar es Salaam"
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
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
