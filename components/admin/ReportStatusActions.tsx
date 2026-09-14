"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReportStatus } from "@/lib/admin/reports";

const OPTIONS: { status: ReportStatus; label: string; className: string }[] = [
  { status: "RESOLVED", label: "Mark Resolved", className: "bg-green-600 hover:bg-green-700" },
  { status: "DISMISSED", label: "Dismiss", className: "bg-neutral-500 hover:bg-neutral-600" },
  { status: "PENDING", label: "Reopen", className: "bg-amber-500 hover:bg-amber-600" },
];

export default function ReportStatusActions({ reportId, currentStatus }: { reportId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<ReportStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSetStatus(status: ReportStatus) {
    setError(null);
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Failed to update report status.");
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
