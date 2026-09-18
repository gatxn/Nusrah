import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { capturePaypalOrder } from "@/lib/payments/paypal";
import { confirmPaypalOrderPaid } from "@/lib/payments/confirm-paypal";
import { jsonError, UNAUTHENTICATED } from "@/lib/api";
import { apiErrors } from "@/lib/i18n/api";

// The primary, synchronous confirmation path — PayPal's capture call
// returns a definitive result directly, so this is authoritative on its
// own (the webhook route is defense-in-depth only, see confirm-paypal.ts).
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const t = await apiErrors(request);
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : null;
  const paypalOrderId = typeof body?.paypalOrderId === "string" ? body.paypalOrderId : null;
  if (!orderId || !paypalOrderId) return jsonError(t.notFound, 400);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) return jsonError(t.orderNotFound, 404);
  if (order.status !== "PENDING") return jsonError(t.orderAlreadyProcessed, 400);

  const capture = await capturePaypalOrder(paypalOrderId);
  if (!capture.success) {
    if (capture.reason === "GATEWAY_NOT_CONFIGURED") {
      return jsonError(t.paymentGatewayNotConfigured, 503, { reason: capture.reason });
    }
    console.error("PayPal capturePaypalOrder failed:", capture.detail);
    return jsonError(t.paymentGatewayError, 502, { reason: capture.reason });
  }

  const result = await confirmPaypalOrderPaid(
    capture.referenceId,
    capture.capturedUsdCents,
    capture.captureId,
    JSON.stringify(capture)
  );

  if (result === "ORDER_NOT_FOUND" || result === "MISMATCH") {
    console.error("PayPal capture rejected:", result, capture);
    return jsonError(t.paymentGatewayError, 502, { reason: result });
  }

  return NextResponse.json({ ok: true });
}
