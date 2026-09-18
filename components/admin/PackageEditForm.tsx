"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedPackage } from "@/lib/packages";

export default function PackageEditForm({ pkg }: { pkg: SerializedPackage }) {
  const router = useRouter();
  const [priceTzs, setPriceTzs] = useState(String(pkg.priceTzs));
  const [priceUsd, setPriceUsd] = useState(pkg.priceUsdCents != null ? (pkg.priceUsdCents / 100).toFixed(2) : "");
  const [durationDays, setDurationDays] = useState(String(pkg.durationDays));
  const [tagline, setTagline] = useState(pkg.tagline);
  const [featuresText, setFeaturesText] = useState(pkg.features.join("\n"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceTzs: Number(priceTzs),
          priceUsdCents: priceUsd.trim() ? Math.round(Number(priceUsd) * 100) : null,
          durationDays: Number(durationDays),
          tagline,
          features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to save changes.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">{pkg.name}</h2>
        <span className="rounded-full bg-blush-50 px-2.5 py-1 text-xs font-semibold text-primary">{pkg.tier}</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Price (TZS)</label>
          <input
            type="number"
            value={priceTzs}
            onChange={(e) => setPriceTzs(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Duration (days)</label>
          <input
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">
            Price (USD, for PayPal — blank hides PayPal for this package)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
            placeholder="e.g. 1.50"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Tagline</label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Features (one per line)</label>
        <textarea
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
