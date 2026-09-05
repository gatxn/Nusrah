import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { checkOrderStatus, extractOrderIdFromWebhook } from "@/lib/payments/gateway";

// ---------------------------------------------------------------------------
// GOLDEN RULE (spec §4.2): a member is never granted paid access merely
// because the frontend displayed a "payment successful" message. This route
// is the ONLY place a paid Subscription is ever activated.
//
// PalmPesa's webhook callbacks are not signed (see lib/payments/gateway.ts),
// so unlike a signature-verified gateway, this route treats the incoming
// body only as a trigger telling it which order to check — it then
// independently re-queries PalmPesa's own /api/order-status endpoint with
// our own API credentials, and only that authenticated response decides
// whether to activate anything. A forged webhook can only cause a real
// status check to run; it cannot activate a subscription on its own.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const orderId = extractOrderIdFromWebhook(rawBody);
  if (!orderId) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { package: true } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotency: PalmPesa may redeliver the same callback more than once.
  // Once an order has left PENDING, it's already been processed.
  if (order.status !== "PENDING") {
    return NextResponse.json({ message: "Already processed" });
  }

  const verified = await checkOrderStatus(orderId);
  if (!verified.ok) {
    // Could not independently confirm — do nothing. PalmPesa will retry
    // the webhook, and the order simply stays PENDING until it can.
    return NextResponse.json({ message: "Could not verify status" }, { status: 202 });
  }

  if (verified.status === "PENDING") {
    return NextResponse.json({ message: "Still pending" });
  }

  try {
    if (verified.status === "COMPLETED") {
      const expiryDate = new Date(Date.now() + order.package.durationDays * 24 * 60 * 60 * 1000);
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            orderId: order.id,
            gatewayTxnId: verified.transactionId,
            gateway: verified.channel ?? "palmpesa",
            phoneNumber: verified.msisdn,
            verifiedAt: new Date(),
            rawPayload: rawBody,
          },
        }),
        prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
        prisma.subscription.upsert({
          where: { userId: order.userId },
          create: { userId: order.userId, packageId: order.packageId, status: "ACTIVE", expiryDate },
          update: { packageId: order.packageId, status: "ACTIVE", expiryDate, startDate: new Date() },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            orderId: order.id,
            gatewayTxnId: verified.transactionId,
            gateway: verified.channel ?? "palmpesa",
            phoneNumber: verified.msisdn,
            verifiedAt: new Date(),
            rawPayload: rawBody,
          },
        }),
        prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } }),
      ]);
    }
  } catch (err) {
    // A near-simultaneous redelivery can race past the PENDING check above
    // and collide on gatewayTxnId's unique constraint — that's a duplicate
    // delivery of the same already-processed result, not a real error.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ message: "Already processed" });
    }
    throw err;
  }

  return NextResponse.json({ message: "Processed" });
}
