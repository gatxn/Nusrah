"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedPackage } from "@/lib/packages";

// Direct admin override — no Order/Transaction involved, deliberately
// outside the payment pipeline (see lib/admin/subscriptions.ts). Separate
// from Payment Confirmations (Phase 4), which confirms a real stuck order.
export default function UserPlanActions({
  userId,
  packages,
  currentPackageId,
}: {
  userId: string;
  packages: SerializedPackage[];
  currentPackageId: string | null;
}) {
  const router = useRouter();
  const [packageId, setPackageId] = useState(currentPackageId ?? packages[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSetPlan() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to set this plan.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to remove this plan.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setRemoving(false);
      setConfirmingRemove(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={packageId}
          onChange={(e) => setPackageId(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.tier})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSetPlan}
          disabled={saving || !packageId}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Set Plan"}
        </button>
      </div>

      {currentPackageId &&
        (confirmingRemove ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRemove}
              disabled={removing}
              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
            >
              {removing ? "Removing..." : "Confirm Remove Plan"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              disabled={removing}
              className="text-xs font-semibold text-neutral-500 hover:underline disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Remove Plan
          </button>
        ))}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
