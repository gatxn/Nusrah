import { prisma } from "@/lib/db";
import { pendingOrderCount } from "@/lib/admin/revenue";

export type AdminAttentionCounts = {
  pendingReports: number;
  pendingVerification: number;
  pendingPayments: number;
};

// Backs the sidebar's per-section badges (components/admin/AdminSidebar.tsx)
// — a live, always-current count of what needs a look in each area, not a
// one-time event like the top-bar bell (lib/admin/alerts.ts). Payments
// intentionally has no event-based alert counterpart: a stuck order is
// discovered by elapsed time, not a state change to hook (see Phase 6),
// so this live count is the only "needs attention" signal for it.
export async function getAdminAttentionCounts(): Promise<AdminAttentionCounts> {
  const [pendingReports, pendingVerification, pendingPayments] = await Promise.all([
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.profile.count({ where: { verificationStatus: "PENDING" } }),
    pendingOrderCount(),
  ]);

  return { pendingReports, pendingVerification, pendingPayments };
}
