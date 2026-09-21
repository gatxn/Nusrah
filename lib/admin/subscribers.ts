import { prisma } from "@/lib/db";

export const ADMIN_SUBSCRIBERS_PAGE_SIZE = 20;

export type AdminSubscriberRow = {
  userId: string;
  name: string;
  phone: string;
  tier: string;
  packageName: string;
  startDate: Date;
  expiryDate: Date;
  // Best-effort: the gateway on this member's most recent PAID order's
  // transaction — not a direct link on Subscription itself (the schema has
  // none), so a member who paid once via AzamPay and was later bumped to a
  // different tier by an admin override would show "manual_admin" here,
  // reflecting the most recent real payment event rather than every past one.
  lastGateway: string | null;
};

/**
 * Every member with a currently-active, unexpired, non-FREE plan — "who's
 * upgraded and paying" as a single list, regardless of which gateway (or an
 * admin override) actually put them there.
 */
export async function queryActiveSubscribers(params: {
  page: number;
}): Promise<{ subscribers: AdminSubscriberRow[]; page: number; pageSize: number; totalCount: number }> {
  const { page } = params;
  const skip = (page - 1) * ADMIN_SUBSCRIBERS_PAGE_SIZE;

  const where = { status: "ACTIVE", expiryDate: { gt: new Date() } } as const;

  const [rows, totalCount] = await Promise.all([
    prisma.subscription.findMany({
      where,
      select: {
        userId: true,
        startDate: true,
        expiryDate: true,
        user: { select: { name: true, phone: true } },
        package: { select: { name: true, tier: true } },
      },
      orderBy: { startDate: "desc" },
      skip,
      take: ADMIN_SUBSCRIBERS_PAGE_SIZE,
    }),
    prisma.subscription.count({ where }),
  ]);

  const userIds = rows.map((r) => r.userId);
  const lastPaidTransactions =
    userIds.length === 0
      ? []
      : await prisma.transaction.findMany({
          where: { order: { userId: { in: userIds }, status: "PAID" } },
          orderBy: { createdAt: "desc" },
          select: { gateway: true, order: { select: { userId: true } } },
        });

  const lastGatewayByUser = new Map<string, string | null>();
  for (const tx of lastPaidTransactions) {
    if (!lastGatewayByUser.has(tx.order.userId)) lastGatewayByUser.set(tx.order.userId, tx.gateway);
  }

  return {
    subscribers: rows.map((r) => ({
      userId: r.userId,
      name: r.user.name,
      phone: r.user.phone,
      tier: r.package.tier,
      packageName: r.package.name,
      startDate: r.startDate,
      expiryDate: r.expiryDate,
      lastGateway: lastGatewayByUser.get(r.userId) ?? null,
    })),
    page,
    pageSize: ADMIN_SUBSCRIBERS_PAGE_SIZE,
    totalCount,
  };
}
