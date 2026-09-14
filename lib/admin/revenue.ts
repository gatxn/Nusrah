import { prisma } from "@/lib/db";

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

export async function confirmedRevenueTzs(): Promise<number> {
  const result = await prisma.order.aggregate({
    where: { status: "PAID" },
    _sum: { amountTzs: true },
  });
  return result._sum.amountTzs ?? 0;
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
