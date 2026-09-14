"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Two-step in-component confirm, not window.confirm() — the latter is
// untestable via browser automation and a real UX antipattern (see
// OrderConfirmActions.tsx, which established this pattern in Phase 4).
export default function ReviewDeleteButton({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to delete this review.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Confirm Delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="text-xs font-semibold text-neutral-500 hover:underline disabled:opacity-60"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="text-xs font-semibold text-red-600 hover:underline">
      Delete
    </button>
  );
}
