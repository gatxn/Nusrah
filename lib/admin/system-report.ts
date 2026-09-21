import { prisma } from "@/lib/db";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";
import {
  confirmedRevenueByGateway,
  pendingUnconfirmedRevenueTzs,
  pendingOrderCount,
  type GatewayRevenueLine,
} from "@/lib/admin/revenue";

export type SystemReportData = {
  generatedAt: Date;
  users: {
    total: number;
    verified: number;
    pendingVerification: number;
    rejected: number;
    notStarted: number;
  };
  paidMembers: {
    activeCount: number;
    byTier: { tier: string; packageName: string; count: number }[];
  };
  reports: {
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  };
  revenue: {
    confirmedTzs: number;
    confirmedUsdCents: number;
    pendingUnconfirmedTzs: number;
    pendingOrderCount: number;
    byGateway: GatewayRevenueLine[];
  };
};

/**
 * One-shot snapshot of the whole system for the printable admin report —
 * reuses the same query functions as the dashboard/payments pages rather
 * than recomputing figures a second way, so the report can never disagree
 * with what the rest of the admin panel shows.
 */
export async function getSystemReport(): Promise<SystemReportData> {
  const [stats, activeSubscriptions, reportsByStatus, pendingTzs, pendingCount, byGateway] = await Promise.all([
    getDashboardStats(),
    prisma.subscription.findMany({
      where: { status: "ACTIVE", expiryDate: { gt: new Date() } },
      select: { package: { select: { tier: true, name: true } } },
    }),
    prisma.report.groupBy({ by: ["status"], _count: { _all: true } }),
    pendingUnconfirmedRevenueTzs(),
    pendingOrderCount(),
    confirmedRevenueByGateway(),
  ]);

  const byTier = new Map<string, { tier: string; packageName: string; count: number }>();
  for (const sub of activeSubscriptions) {
    const entry = byTier.get(sub.package.tier) ?? { tier: sub.package.tier, packageName: sub.package.name, count: 0 };
    entry.count += 1;
    byTier.set(sub.package.tier, entry);
  }

  const reportCounts = { pending: 0, resolved: 0, dismissed: 0 };
  for (const row of reportsByStatus) {
    if (row.status === "PENDING") reportCounts.pending = row._count._all;
    else if (row.status === "RESOLVED") reportCounts.resolved = row._count._all;
    else if (row.status === "DISMISSED") reportCounts.dismissed = row._count._all;
  }

  return {
    generatedAt: new Date(),
    users: {
      total: stats.totalUsers.value,
      verified: stats.verificationBreakdown.verified,
      pendingVerification: stats.verificationBreakdown.pending,
      rejected: stats.verificationBreakdown.rejected,
      notStarted: stats.verificationBreakdown.notStarted,
    },
    paidMembers: {
      activeCount: activeSubscriptions.length,
      byTier: Array.from(byTier.values()).sort((a, b) => b.count - a.count),
    },
    reports: {
      total: stats.reportedAccounts.value,
      ...reportCounts,
    },
    revenue: {
      confirmedTzs: stats.confirmedRevenueTzs.value,
      confirmedUsdCents: stats.confirmedRevenueUsdCents.value,
      pendingUnconfirmedTzs: pendingTzs,
      pendingOrderCount: pendingCount,
      byGateway,
    },
  };
}
