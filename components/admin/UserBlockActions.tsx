"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Two-step in-component confirm, not window.confirm() — matches the
// pattern established in OrderConfirmActions.tsx (Phase 4) and
// ReviewDeleteButton.tsx (Phase 7): native dialogs are untestable via
// browser automation and a real UX antipattern.
export default function UserBlockActions({ userId, isSuspended }: { userId: string; isSuspended: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${isSuspended ? "unblock" : "block"}`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to update this account.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (isSuspended) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleAction}
          disabled={loading}
          className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Unblocking..." : "Unblock Account"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-navy">This member will be signed out and unable to log back in.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAction}
            disabled={loading}
            className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Blocking..." : "Yes, Block Account"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
      >
        Block Account
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
