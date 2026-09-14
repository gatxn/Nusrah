import { prisma } from "@/lib/db";
import { confirmedRevenueTzs } from "@/lib/admin/revenue";
import { countMutualMatches, matchesPerDay } from "@/lib/admin/matches";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

export type StatWithChange = { value: number; changePercent: number | null };

/**
 * Real period-over-period comparison (last 30 days vs. the 30 before that),
 * using whichever timestamp actually represents "when this thing happened"
 * — never a proxy. Returns null for changePercent when there's no
 * meaningful prior-period baseline (avoids a nonsensical "+∞%").
 */
function computeChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export type DashboardStats = {
  totalUsers: StatWithChange;
  // No verifiedAt/statusChangedAt timestamp exists on Profile — a profile
  // created months ago can be verified today, so there's no honest way to
  // say "X became verified in the last 30 days." Shown as a plain
  // point-in-time count, deliberately with no %-change badge, rather than
  // fabricating one from createdAt (which would measure something else
  // entirely).
  verifiedProfiles: { value: number };
  pendingVerification: { value: number };
  activeMatches: StatWithChange;
  reportedAccounts: StatWithChange;
  confirmedRevenueTzs: StatWithChange;
  verificationBreakdown: { notStarted: number; pending: number; verified: number; rejected: number };
};

/** New user registrations per day over the trailing `days` days, oldest first. */
export async function registrationsPerDay(days: number): Promise<number[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const since = new Date(startOfToday.getTime() - (days - 1) * DAY_MS);

  const users = await prisma.user.findMany({
    where: { role: "MEMBER", createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Array(days).fill(0);
  for (const u of users) {
    const dayIndex = Math.floor((startOfToday.getTime() - u.createdAt.getTime()) / DAY_MS);
    const bucket = days - 1 - dayIndex;
    if (bucket >= 0 && bucket < days) buckets[bucket]++;
  }
  return buckets;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const start30 = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);
  const start60 = new Date(now.getTime() - 2 * WINDOW_DAYS * DAY_MS);

  const [
    totalUserCount,
    usersLast30,
    usersPrev30,
    matchTotal,
    matchesPerDay60,
    reportTotal,
    reportsLast30,
    reportsPrev30,
    revenueTotal,
    revenueLast30,
    revenuePrev30,
    verifiedCount,
    pendingCount,
    notStartedCount,
    rejectedCount,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: start30 } } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: start60, lt: start30 } } }),
    countMutualMatches(),
    matchesPerDay(2 * WINDOW_DAYS),
    prisma.report.count(),
    prisma.report.count({ where: { createdAt: { gte: start30 } } }),
    prisma.report.count({ where: { createdAt: { gte: start60, lt: start30 } } }),
    confirmedRevenueTzs(),
    prisma.order.aggregate({
      where: { status: "PAID", transactions: { some: { verifiedAt: { gte: start30 } } } },
      _sum: { amountTzs: true },
    }),
    prisma.order.aggregate({
      where: { status: "PAID", transactions: { some: { verifiedAt: { gte: start60, lt: start30 } } } },
      _sum: { amountTzs: true },
    }),
    prisma.profile.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.profile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.profile.count({ where: { verificationStatus: "NOT_STARTED" } }),
    prisma.profile.count({ where: { verificationStatus: "REJECTED" } }),
  ]);

  const matchesLast30 = matchesPerDay60.slice(WINDOW_DAYS).reduce((a, b) => a + b, 0);
  const matchesPrev30 = matchesPerDay60.slice(0, WINDOW_DAYS).reduce((a, b) => a + b, 0);

  return {
    totalUsers: { value: totalUserCount, changePercent: computeChange(usersLast30, usersPrev30) },
    verifiedProfiles: { value: verifiedCount },
    pendingVerification: { value: pendingCount },
    activeMatches: { value: matchTotal, changePercent: computeChange(matchesLast30, matchesPrev30) },
    reportedAccounts: { value: reportTotal, changePercent: computeChange(reportsLast30, reportsPrev30) },
    confirmedRevenueTzs: {
      value: revenueTotal,
      changePercent: computeChange(revenueLast30._sum.amountTzs ?? 0, revenuePrev30._sum.amountTzs ?? 0),
    },
    verificationBreakdown: {
      notStarted: notStartedCount,
      pending: pendingCount,
      verified: verifiedCount,
      rejected: rejectedCount,
    },
  };
}
