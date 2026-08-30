"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { INTENTIONS, INTENTION_LABELS, isIntention, type Intention } from "@/lib/onboarding";
import { ChevronLeftIcon } from "@/components/icons";

export default function IntentionsForm({ initialIntentions }: { initialIntentions: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Intention[]>(
    initialIntentions.filter(isIntention)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(intention: Intention) {
    setSelected((prev) =>
      prev.includes(intention) ? prev.filter((i) => i !== intention) : [...prev, intention]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selected.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/intentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentions: selected }),
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
        <h2 className="text-lg font-bold text-navy">Unatafuta nini kwenye Nusrah?</h2>
        <p className="mt-1 text-sm text-neutral-600">Unaweza kuchagua zaidi ya chaguo moja.</p>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {INTENTIONS.map((intention) => {
          const active = selected.includes(intention);
          return (
            <button
              key={intention}
              type="button"
              onClick={() => toggle(intention)}
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/onboarding/address")}
          className="flex items-center gap-1.5 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-blush-50"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Rudi Nyuma
        </button>
        <button
          type="submit"
          disabled={loading || selected.length === 0}
          className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? "Inaendelea..." : "Endelea"}
        </button>
      </div>
    </form>
  );
}
