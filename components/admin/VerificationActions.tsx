"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VerificationStatus } from "@/lib/admin/users";

const OPTIONS: { status: VerificationStatus; label: string; className: string }[] = [
  { status: "VERIFIED", label: "Verify", className: "bg-green-600 hover:bg-green-700" },
  { status: "REJECTED", label: "Reject", className: "bg-red-600 hover:bg-red-700" },
  { status: "PENDING", label: "Mark Pending", className: "bg-amber-500 hover:bg-amber-600" },
];

export default function VerificationActions({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<VerificationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSetStatus(status: VerificationStatus) {
    setError(null);
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/profiles/${userId}/verification`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to update verification status.");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {OPTIONS.filter((o) => o.status !== currentStatus).map((o) => (
          <button
            key={o.status}
            type="button"
            onClick={() => handleSetStatus(o.status)}
            disabled={loading !== null}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${o.className}`}
          >
            {loading === o.status ? "Saving..." : o.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
