"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderConfirmActions({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "confirm" | "reject") {
    setError(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/${action}`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to update this order.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(null);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-navy">Confirm only with real proof (SMS, receipt).</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleAction("confirm")}
            disabled={loading !== null}
            className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {loading === "confirm" ? "Confirming..." : "Yes, Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={loading !== null}
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={loading !== null}
          className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          Confirm Payment
        </button>
        <button
          type="button"
          onClick={() => handleAction("reject")}
          disabled={loading !== null}
          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {loading === "reject" ? "Rejecting..." : "Reject"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
