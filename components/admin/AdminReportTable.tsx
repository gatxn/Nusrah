import Link from "next/link";
import type { AdminReportRow } from "@/lib/admin/reports";

const SEVERITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  LOW: "bg-neutral-100 text-neutral-500",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-green-50 text-green-700",
  DISMISSED: "bg-neutral-100 text-neutral-500",
};

const REASON_LABELS: Record<string, string> = {
  FAKE_PROFILE: "Suspicious profile",
  SCAM: "Scam",
  MONEY_REQUEST: "Money request",
  HARASSMENT: "Harassment",
  THREATS: "Threats",
  SPAM: "Spam message",
  IMPERSONATION: "Impersonation",
  INAPPROPRIATE_CONTENT: "Inappropriate message",
  FALSE_INFO: "Fake information",
  TERMS_VIOLATION: "Terms violation",
  OTHER: "Other",
};

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminReportTable({ reports }: { reports: AdminReportRow[] }) {
  if (reports.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-neutral-500">No reports match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Reported User</th>
            <th className="px-4 py-3">Filed By</th>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Severity</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-3 font-medium text-navy">{REASON_LABELS[r.reason] ?? r.reason}</td>
              <td className="px-4 py-3 text-neutral-600">{r.reportedUserName}</td>
              <td className="px-4 py-3 text-neutral-600">{r.reporterName}</td>
              <td className="px-4 py-3 text-neutral-500">{timeAgo(r.createdAt)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SEVERITY_STYLES[r.severity]}`}>
                  {r.severity.charAt(0) + r.severity.slice(1).toLowerCase()}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[r.status] ?? STATUS_STYLES.PENDING}`}>
                  {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy/90"
                >
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
