import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature, parseWebhookPayload } from "@/lib/payments/gateway";

// ---------------------------------------------------------------------------
// GOLDEN RULE (spec §4.2): a member is never granted paid access merely
// because the frontend displayed a "payment successful" message. This route
// is the ONLY place a paid Subscription is ever activated.
//
// Unlike PalmPesa (unsigned callbacks, which forced an independent re-query
// against a second endpoint that turned out to be broken — see the
// palmpesa_order_id_correlation_broken project note), AzamPay signs its
// webhook via the `x-azampay-signature` header. The trust boundary here is
// signature verification, not a second API call — see the ⚠️ UNVERIFIED
// warning in lib/payments/gateway.ts: the exact signing algorithm hasn't
// been confirmed against a real webhook delivery yet. This gate fails
// closed on any signature it can't positively verify.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-azampay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = parseWebhookPayload(rawBody);
  if (!payload) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: payload.externalId }, include: { package: true } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotency: AzamPay may redeliver the same callback more than once.
  // Once an order has left PENDING, it's already been processed.
  if (order.status !== "PENDING") {
    return NextResponse.json({ message: "Already processed" });
  }

  if (payload.status === "pending") {
    return NextResponse.json({ message: "Still pending" });
  }

  try {
    if (payload.status === "success") {
      const expiryDate = new Date(Date.now() + order.package.durationDays * 24 * 60 * 60 * 1000);
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            orderId: order.id,
            gatewayTxnId: payload.transactionId,
            gateway: payload.provider ?? "azampay",
            phoneNumber: payload.msisdn,
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
            gatewayTxnId: payload.transactionId,
            gateway: payload.provider ?? "azampay",
            phoneNumber: payload.msisdn,
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
