import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminReportDetail } from "@/lib/admin/reports";
import ReportStatusActions from "@/components/admin/ReportStatusActions";

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export default async function AdminReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await getAdminReportDetail(reportId);
  if (!report) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">{REASON_LABELS[report.reason] ?? report.reason}</h1>
      <p className="mt-1 text-sm text-neutral-500">Filed {formatDate(report.createdAt)}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-navy">{report.description}</p>

            {report.hasEvidence && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Evidence</h2>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only, authenticated fetch */}
                <img
                  src={`/api/admin/reports/${report.id}/evidence`}
                  alt="Report evidence"
                  className="mt-2 max-w-sm rounded-xl border border-black/10"
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Status</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Current status: <span className="font-semibold text-navy">{report.status}</span>
            </p>
            <div className="mt-4">
              <ReportStatusActions reportId={report.id} currentStatus={report.status} />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Reported User</h2>
            <p className="mt-2 font-medium text-navy">{report.reportedUserName}</p>
            <Link
              href={`/admin/users/${report.reportedUserId}`}
              className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View profile →
            </Link>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Filed By</h2>
            <p className="mt-2 font-medium text-navy">{report.reporterName}</p>
            <Link
              href={`/admin/users/${report.reporterId}`}
              className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
            >
              View profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
