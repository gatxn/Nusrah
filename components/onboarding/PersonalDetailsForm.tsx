"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getAge } from "@/lib/dates";
import { MIN_AGE } from "@/lib/onboarding";

const GENDER_LABELS: Record<string, string> = { FEMALE: "Mwanamke", MALE: "Mwanaume" };

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default function PersonalDetailsForm({
  name,
  gender,
  initialDob,
}: {
  name: string;
  gender: string | null;
  initialDob: Date | null;
}) {
  const router = useRouter();
  const [dob, setDob] = useState(toDateInputValue(initialDob));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const age = useMemo(() => {
    if (!dob) return null;
    const parsed = new Date(dob);
    if (Number.isNaN(parsed.getTime())) return null;
    return getAge(parsed);
  }, [dob]);

  const underMinAge = age !== null && age < MIN_AGE;
  const canContinue = dob.length > 0 && age !== null && !underMinAge;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dob }),
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
          <p className={`mt-1.5 text-sm ${underMinAge ? "text-red-600" : "text-neutral-600"}`}>
            Umri: {age}
          </p>
        )}
      </div>

      {underMinAge && (
        <p className="text-sm text-red-600">
          Lazima uwe na umri wa miaka {MIN_AGE} au zaidi kutumia Nusrah.
        </p>
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
