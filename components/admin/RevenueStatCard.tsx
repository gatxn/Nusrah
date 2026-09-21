"use client";

import { useEffect, useRef, useState } from "react";
import type { GatewayRevenueLine } from "@/lib/admin/revenue";

function formatTzs(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

function formatLine(line: GatewayRevenueLine): string {
  const parts: string[] = [];
  if (line.amountTzs > 0) parts.push(`${formatTzs(line.amountTzs)} TZS`);
  if (line.amountUsdCents > 0) parts.push(`$${(line.amountUsdCents / 100).toFixed(2)}`);
  return parts.length > 0 ? parts.join(" + ") : "0";
}

// Same visual shape as StatCard, but the whole card is a button that opens a
// small breakdown of confirmed revenue per payment gateway — clicking
// anywhere outside it closes it (same pattern as GlobalSearchBox/
// AdminNotificationBell).
export default function RevenueStatCard({
  icon,
  label,
  value,
  changePercent,
  breakdown,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  changePercent?: number | null;
  breakdown: GatewayRevenueLine[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-2xl border border-black/5 bg-white p-4 text-left shadow-sm transition hover:border-primary/30 hover:shadow-md"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-50 text-primary">{icon}</div>
        <p className="mt-3 text-xs font-medium text-neutral-500">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-navy">{value}</p>
        {changePercent !== undefined && changePercent !== null && (
          <p className={`mt-1 text-xs font-semibold ${changePercent >= 0 ? "text-green-600" : "text-red-500"}`}>
            {changePercent >= 0 ? "↑" : "↓"} {Math.abs(changePercent)}%{" "}
            <span className="font-normal text-neutral-400">vs last 30 days</span>
          </p>
        )}
        <p className="mt-1.5 text-xs font-semibold text-primary">
          {open ? "Hide breakdown ▲" : "By gateway ▼"}
        </p>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-2xl border border-black/5 bg-white p-3 shadow-lg">
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-neutral-400">Earnings by Gateway</p>
          {breakdown.length === 0 ? (
            <p className="px-1 py-2 text-sm text-neutral-500">No confirmed payments yet.</p>
          ) : (
            <ul className="space-y-2">
              {breakdown.map((line) => (
                <li key={line.label} className="flex items-center justify-between gap-3 px-1 text-sm">
                  <span className="text-neutral-600">
                    {line.label} <span className="text-neutral-400">({line.orderCount})</span>
                  </span>
                  <span className="shrink-0 font-semibold text-navy">{formatLine(line)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
