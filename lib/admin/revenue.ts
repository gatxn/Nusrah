import { prisma } from "@/lib/db";
import { gatewayCategory, GATEWAY_CATEGORY_LABELS } from "@/lib/admin/gateway-labels";

// Always shown as TWO figures, never one — this project's payment gateway
// history (PalmPesa, then AzamPay) has repeatedly shown that a webhook
// confirming a payment is NOT reliable, so most real Orders can sit at
// PENDING indefinitely even though the customer's money was actually taken.
// A single "Revenue" number computed only from status='PAID' would
// therefore badly understate what was actually collected. See the
// palmpesa_order_id_correlation_broken and
// azampay_webhook_destination_unknown project notes.

// Orders younger than this are still just "customer hasn't paid yet" —
// not yet worth counting as unconfirmed revenue at risk.
const PENDING_AGE_THRESHOLD_HOURS = 1;

// Only sums orders actually collected in TZS — a PayPal order's amountTzs
// still holds the package's nominal TZS list price for display purposes
// (see the Order.amountTzs comment in schema.prisma), but summing that
// into "TZS revenue" would silently mix real TZS collected via mobile
// money with a USD charge as if they were the same currency.
export async function confirmedRevenueTzs(): Promise<number> {
  const result = await prisma.order.aggregate({
    where: { status: "PAID", currency: "TZS" },
    _sum: { amountTzs: true },
  });
  return result._sum.amountTzs ?? 0;
}

export async function confirmedRevenueUsdCents(): Promise<number> {
  const result = await prisma.order.aggregate({
    where: { status: "PAID", currency: "USD" },
    _sum: { amountUsdCents: true },
  });
  return result._sum.amountUsdCents ?? 0;
}

export async function pendingUnconfirmedRevenueTzs(): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_AGE_THRESHOLD_HOURS * 60 * 60 * 1000);
  const result = await prisma.order.aggregate({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    _sum: { amountTzs: true },
  });
  return result._sum.amountTzs ?? 0;
}

export async function pendingOrderCount(): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_AGE_THRESHOLD_HOURS * 60 * 60 * 1000);
  return prisma.order.count({ where: { status: "PENDING", createdAt: { lt: cutoff } } });
}

export type GatewayRevenueLine = { label: string; amountTzs: number; amountUsdCents: number; orderCount: number };

/**
 * Confirmed revenue split by gateway category (see lib/admin/gateway-labels)
 * within each currency it was actually collected in — never force-converted
 * into one combined number, for the same reason confirmedRevenueTzs and
 * confirmedRevenueUsdCents are already kept separate above.
 */
export async function confirmedRevenueByGateway(): Promise<GatewayRevenueLine[]> {
  const paidOrders = await prisma.order.findMany({
    where: { status: "PAID" },
    select: {
      currency: true,
      amountTzs: true,
      amountUsdCents: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 1, select: { gateway: true } },
    },
  });

  const totals = new Map<string, GatewayRevenueLine>();
  for (const order of paidOrders) {
    const category = gatewayCategory(order.transactions[0]?.gateway ?? null);
    const label = GATEWAY_CATEGORY_LABELS[category];
    const line = totals.get(label) ?? { label, amountTzs: 0, amountUsdCents: 0, orderCount: 0 };
    if (order.currency === "USD") {
      line.amountUsdCents += order.amountUsdCents ?? 0;
    } else {
      line.amountTzs += order.amountTzs;
    }
    line.orderCount += 1;
    totals.set(label, line);
  }

  return Array.from(totals.values()).sort((a, b) => b.amountTzs - a.amountTzs);
}
