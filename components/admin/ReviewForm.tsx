"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@prisma/client";

export default function ReviewForm({ review }: { review?: Review }) {
  const router = useRouter();
  const isEdit = !!review;
  const [name, setName] = useState(review?.name ?? "");
  const [city, setCity] = useState(review?.city ?? "");
  const [rating, setRating] = useState(String(review?.rating ?? 5));
  const [body, setBody] = useState(review?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/reviews/${review.id}` : "/api/admin/reviews", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, rating: Number(rating), body }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to save this review.");
        return;
      }
      router.push("/admin/content/reviews");
      router.refresh();
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Rating</label>
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="w-full max-w-[120px] rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-neutral-500">Review text</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          maxLength={1000}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Review"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
