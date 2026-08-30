import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, getActiveSubscription } from "@/lib/auth";
import { daysRemainingUntil } from "@/lib/dates";
import { UNAUTHENTICATED } from "@/lib/api";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return UNAUTHENTICATED();

  const subscription = await getActiveSubscription(userId);

  const lastOrder = await prisma.order.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      package: true,
      transactions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const daysRemaining = subscription ? daysRemainingUntil(subscription.expiryDate) : 0;

  return NextResponse.json({
    name: user.name,
    phone: user.phone,
    otpVerified: user.otpVerified,
    tier: subscription?.tier ?? "FREE",
    subscriptionStatus: subscription ? "ACTIVE" : "NONE",
    packageName: subscription?.packageName ?? "FREE",
    expiryDate: subscription?.expiryDate ?? null,
    daysRemaining,
    lastOrder: lastOrder
      ? {
          id: lastOrder.id,
          packageName: lastOrder.package.name,
          amountTzs: lastOrder.amountTzs,
          status: lastOrder.status,
          paymentConfirmed: Boolean(lastOrder.transactions[0]?.verifiedAt),
        }
      : null,
  });
}
