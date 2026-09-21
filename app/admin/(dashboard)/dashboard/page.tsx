import Link from "next/link";
import { getDashboardStats, registrationsPerDay } from "@/lib/admin/dashboard-stats";
import { matchesPerDay } from "@/lib/admin/matches";
import { pendingOrderCount, confirmedRevenueByGateway } from "@/lib/admin/revenue";
import { queryAdminUsers } from "@/lib/admin/users";
import { queryAdminReports } from "@/lib/admin/reports";
import StatCard from "@/components/admin/StatCard";
import RevenueStatCard from "@/components/admin/RevenueStatCard";
import DonutChart from "@/components/admin/DonutChart";
import BarLineChart from "@/components/admin/BarLineChart";
import AdminUserTable from "@/components/admin/AdminUserTable";
import AdminReportTable from "@/components/admin/AdminReportTable";
import { UsersIcon, ShieldCheckIcon, ClockIcon, HeartFilledIcon, FlagIcon, CreditCardIcon } from "@/components/icons";

function formatTzs(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

const CHART_DAYS = 30;

export default async function AdminDashboardPage() {
  const [stats, registrations, matches, pendingPayments, recentUsers, recentReports, revenueByGateway] =
    await Promise.all([
      getDashboardStats(),
      registrationsPerDay(CHART_DAYS),
      matchesPerDay(CHART_DAYS),
      pendingOrderCount(),
      queryAdminUsers({ page: 1, sort: "newest" }),
      queryAdminReports({ page: 1, status: "PENDING" }),
      confirmedRevenueByGateway(),
    ]);

  const v = stats.verificationBreakdown;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">Here&apos;s what&apos;s happening on Nusrah.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={<UsersIcon className="h-4.5 w-4.5" />} label="Total Users" value={String(stats.totalUsers.value)} changePercent={stats.totalUsers.changePercent} />
        <StatCard icon={<ShieldCheckIcon className="h-4.5 w-4.5" />} label="Verified Profiles" value={String(stats.verifiedProfiles.value)} />
        <StatCard icon={<ClockIcon className="h-4.5 w-4.5" />} label="Pending Verification" value={String(stats.pendingVerification.value)} />
        <StatCard icon={<HeartFilledIcon className="h-4.5 w-4.5" />} label="Active Matches" value={String(stats.activeMatches.value)} changePercent={stats.activeMatches.changePercent} />
        <StatCard icon={<FlagIcon className="h-4.5 w-4.5" />} label="Reported Accounts" value={String(stats.reportedAccounts.value)} changePercent={stats.reportedAccounts.changePercent} />
        <RevenueStatCard icon={<CreditCardIcon className="h-4.5 w-4.5" />} label="Revenue (TZS)" value={`${formatTzs(stats.confirmedRevenueTzs.value)} TZS`} changePercent={stats.confirmedRevenueTzs.changePercent} breakdown={revenueByGateway} />
        <StatCard icon={<CreditCardIcon className="h-4.5 w-4.5" />} label="Revenue (PayPal)" value={`$${(stats.confirmedRevenueUsdCents.value / 100).toFixed(2)}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-navy">New Registrations &amp; Matches</h2>
          <p className="text-xs text-neutral-400">Last {CHART_DAYS} days</p>
          <div className="mt-4">
            <BarLineChart bars={registrations} line={matches} barLabel="New Registrations" lineLabel="Matches" />
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-navy">Profile Verification Status</h2>
          <div className="mt-4">
            <DonutChart
              centerLabel="Verified"
              segments={[
                { label: "Verified", value: v.verified, hex: "#16a34a", colorClass: "fill-green-600" },
                { label: "Pending", value: v.pending, hex: "#f59e0b", colorClass: "fill-amber-500" },
                { label: "Rejected", value: v.rejected, hex: "#ef4444", colorClass: "fill-red-500" },
                { label: "Not Started", value: v.notStarted, hex: "#d4d4d4", colorClass: "fill-neutral-300" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-navy">Pending Actions</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <Link href="/admin/verification" className="text-neutral-600 hover:text-primary">
                Profiles Awaiting Verification
              </Link>
              <span className="font-semibold text-navy">{stats.pendingVerification.value}</span>
            </li>
            <li className="flex items-center justify-between">
              <Link href="/admin/reports?status=PENDING" className="text-neutral-600 hover:text-primary">
                Reports to Review
              </Link>
              <span className="font-semibold text-navy">{recentReports.totalCount}</span>
            </li>
            <li className="flex items-center justify-between">
              <Link href="/admin/payments/pending" className="text-neutral-600 hover:text-primary">
                Payment Confirmations
              </Link>
              <span className="font-semibold text-navy">{pendingPayments}</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Recent Reports</h2>
            <Link href="/admin/reports" className="text-xs font-semibold text-primary hover:underline">
              View All Reports →
            </Link>
          </div>
          <div className="mt-2 -mx-6">
            <AdminReportTable reports={recentReports.reports.slice(0, 5)} />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-sm font-semibold text-navy">Recent Users</h2>
          <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">
            View All Users →
          </Link>
        </div>
        <div className="mt-2">
          <AdminUserTable users={recentUsers.users.slice(0, 8)} />
        </div>
      </div>
    </div>
  );
}
