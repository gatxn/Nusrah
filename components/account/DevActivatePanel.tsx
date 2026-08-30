"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIERS } from "@/lib/tiers";

// Dev/test-only control: activates a tier without going through the payment
// gateway, so tier-gated features can be exercised before real gateway
// credentials exist. Only rendered when NODE_ENV !== "production" (see
// app/akaunti/page.tsx) and only ever hits the dev-only API route, never the
// production webhook path.
export default function DevActivatePanel({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function activate(tier: string) {
    setLoading(tier);
    setError(null);
    try {
      const res = await fetch("/api/dev/activate-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, packageTier: tier }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Hitilafu imetokea");
        return;
      }
      router.refresh();
    } catch {
      setError("Imeshindwa kuunganisha na seva.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Zana ya Majaribio (Dev Mode)
      </p>
      <p className="mt-1 text-xs text-amber-700/80">
        Malipo ya kweli bado hayajasanidiwa. Tumia vitufe hivi kuwasha kifurushi kwa ajili ya
        majaribio ya ndani pekee — huu si mchakato wa malipo halisi.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => activate(tier)}
            disabled={loading !== null}
            className="rounded-full border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
          >
            {loading === tier ? "..." : tier}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
