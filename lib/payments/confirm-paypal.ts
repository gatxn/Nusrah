import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type ConfirmPaypalResult = "CONFIRMED" | "ALREADY_PROCESSED" | "ORDER_NOT_FOUND" | "MISMATCH";

/**
 * Shared by the capture-order route (primary, synchronous path) and the
 * PayPal webhook route (defense-in-depth) so both apply the exact same
 * checks — most importantly that the captured PayPal order's reference_id
 * really is this Nusrah orderId, and the captured amount really meets the
 * package's price, before ever granting access. Never trust a
 * client-supplied paypalOrderId/amount at face value; this is what stops a
 * member from creating a cheap PayPal order elsewhere and passing its id to
 * capture a different, higher-value Nusrah order.
 */
export async function confirmPaypalOrderPaid(
  referenceId: string,
  capturedUsdCents: number,
  captureId: string,
  rawPayload: string
): Promise<ConfirmPaypalResult> {
  const order = await prisma.order.findUnique({ where: { id: referenceId }, include: { package: true } });
  if (!order) return "ORDER_NOT_FOUND";
  if (order.status !== "PENDING") return "ALREADY_PROCESSED";

  const expectedCents = order.package.priceUsdCents;
  if (expectedCents == null || capturedUsdCents < expectedCents) return "MISMATCH";

  const expiryDate = new Date(Date.now() + order.package.durationDays * 24 * 60 * 60 * 1000);

  try {
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          orderId: order.id,
          gatewayTxnId: captureId,
          gateway: "paypal",
          phoneNumber: null,
          verifiedAt: new Date(),
          rawPayload,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", currency: "USD", amountUsdCents: capturedUsdCents },
      }),
      prisma.subscription.upsert({
        where: { userId: order.userId },
        create: { userId: order.userId, packageId: order.packageId, status: "ACTIVE", expiryDate },
        update: { packageId: order.packageId, status: "ACTIVE", expiryDate, startDate: new Date() },
      }),
    ]);
  } catch (err) {
    // A near-simultaneous capture-route call and webhook redelivery can
    // both pass the PENDING check above and collide on gatewayTxnId's
    // unique constraint — that's a duplicate confirmation of the same
    // already-processed capture, not a real error (mirrors the identical
    // race handled in the AzamPay webhook route).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return "ALREADY_PROCESSED";
    }
    throw err;
  }

  return "CONFIRMED";
}
