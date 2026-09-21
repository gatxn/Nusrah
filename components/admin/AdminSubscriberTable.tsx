import Link from "next/link";
import type { AdminSubscriberRow } from "@/lib/admin/subscribers";
import { gatewayCategory, GATEWAY_CATEGORY_LABELS } from "@/lib/admin/gateway-labels";

const TIER_STYLES: Record<string, string> = {
  BASIC: "bg-neutral-100 text-neutral-700",
  SILVER: "bg-slate-100 text-slate-700",
  GOLD: "bg-amber-50 text-amber-700",
  PREMIUM: "bg-purple-50 text-purple-700",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function AdminSubscriberTable({ subscribers }: { subscribers: AdminSubscriberRow[] }) {
  if (subscribers.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-neutral-500">No active paid members right now.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Started</th>
            <th className="px-4 py-3">Expires</th>
            <th className="px-4 py-3">Last Paid Via</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {subscribers.map((s) => (
            <tr key={s.userId} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-3 font-medium text-navy">{s.name}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TIER_STYLES[s.tier] ?? "bg-neutral-100 text-neutral-700"}`}>
                  {s.packageName}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-500">{formatDate(s.startDate)}</td>
              <td className="px-4 py-3 text-neutral-500">{formatDate(s.expiryDate)}</td>
              <td className="px-4 py-3 text-neutral-600">
                {s.lastGateway ? GATEWAY_CATEGORY_LABELS[gatewayCategory(s.lastGateway)] : "—"}
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/users/${s.userId}`} className="text-xs font-semibold text-primary hover:underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
