import { getSystemReport } from "@/lib/admin/system-report";
import PrintReportButton from "@/components/admin/PrintReportButton";

function formatTzs(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm print:shadow-none">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-navy">{value}</p>
    </div>
  );
}

export default async function AdminSystemReportPage() {
  const report = await getSystemReport();

  return (
    <div className="p-6 print:p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">System Report</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Generated {formatDateTime(report.generatedAt)} — users, paid members, reports, and income all in one
            place.
          </p>
        </div>
        <PrintReportButton />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-navy">Users</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatBlock label="Total Users" value={report.users.total} />
          <StatBlock label="Verified" value={report.users.verified} />
          <StatBlock label="Pending Verification" value={report.users.pendingVerification} />
          <StatBlock label="Rejected" value={report.users.rejected} />
          <StatBlock label="Not Started" value={report.users.notStarted} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-navy">Paid Members</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="Currently Active" value={report.paidMembers.activeCount} />
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm print:shadow-none">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Active Members</th>
              </tr>
            </thead>
            <tbody>
              {report.paidMembers.byTier.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-neutral-500">
                    No active paid members.
                  </td>
                </tr>
              ) : (
                report.paidMembers.byTier.map((row) => (
                  <tr key={row.tier} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-navy">{row.packageName}</td>
                    <td className="px-4 py-3">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-navy">Reports</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="Total" value={report.reports.total} />
          <StatBlock label="Pending" value={report.reports.pending} />
          <StatBlock label="Resolved" value={report.reports.resolved} />
          <StatBlock label="Dismissed" value={report.reports.dismissed} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-navy">Income</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="Confirmed Revenue (TZS)" value={`${formatTzs(report.revenue.confirmedTzs)} TZS`} />
          <StatBlock label="Confirmed Revenue (PayPal)" value={`$${(report.revenue.confirmedUsdCents / 100).toFixed(2)}`} />
          <StatBlock
            label="Pending / Unconfirmed (TZS)"
            value={`${formatTzs(report.revenue.pendingUnconfirmedTzs)} TZS`}
          />
          <StatBlock label="Orders Stuck Pending" value={report.revenue.pendingOrderCount} />
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm print:shadow-none">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Gateway</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.revenue.byGateway.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-neutral-500">
                    No confirmed payments yet.
                  </td>
                </tr>
              ) : (
                report.revenue.byGateway.map((line) => (
                  <tr key={line.label} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3 font-medium text-navy">{line.label}</td>
                    <td className="px-4 py-3">{line.orderCount}</td>
                    <td className="px-4 py-3">
                      {[
                        line.amountTzs > 0 ? `${formatTzs(line.amountTzs)} TZS` : null,
                        line.amountUsdCents > 0 ? `$${(line.amountUsdCents / 100).toFixed(2)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" + ") || "0"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
