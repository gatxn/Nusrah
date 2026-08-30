import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature, parseWebhookPayload } from "@/lib/payments/gateway";

// ---------------------------------------------------------------------------
// GOLDEN RULE (spec §4.2): a member is never granted paid access merely
// because the frontend displayed a "payment successful" message. This route
// is the ONLY place a paid Subscription is ever activated, and it only runs
// after independently verifying the payment gateway's own server-to-server
// callback signature below. Client-reported payment state is never trusted.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload;
  try {
    payload = parseWebhookPayload(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  // Idempotency: a gateway may redeliver the same callback more than once.
  const existing = await prisma.transaction.findUnique({
    where: { gatewayTxnId: payload.gatewayTxnId },
  });
  if (existing) {
    return NextResponse.json({ message: "Already processed" });
  }

  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
    include: { package: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (payload.status === "success") {
    const expiryDate = new Date(
      Date.now() + order.package.durationDays * 24 * 60 * 60 * 1000
    );
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          orderId: order.id,
          gatewayTxnId: payload.gatewayTxnId,
          gateway: payload.gateway,
          phoneNumber: payload.phoneNumber,
          verifiedAt: new Date(),
          rawPayload: rawBody,
        },
      }),
      prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
      prisma.subscription.upsert({
        where: { userId: order.userId },
        create: {
          userId: order.userId,
          packageId: order.packageId,
          status: "ACTIVE",
          expiryDate,
        },
        update: {
          packageId: order.packageId,
          status: "ACTIVE",
          expiryDate,
          startDate: new Date(),
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          orderId: order.id,
          gatewayTxnId: payload.gatewayTxnId,
          gateway: payload.gateway,
          phoneNumber: payload.phoneNumber,
          verifiedAt: new Date(),
          rawPayload: rawBody,
        },
      }),
      prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } }),
    ]);
  }

  return NextResponse.json({ message: "Processed" });
}
