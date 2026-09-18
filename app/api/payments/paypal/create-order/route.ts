import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { createPaypalOrder } from "@/lib/payments/paypal";
import { jsonError, UNAUTHENTICATED } from "@/lib/api";
import { apiErrors } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const t = await apiErrors(request);
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : null;
  if (!orderId) return jsonError(t.notFound, 400);

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { package: true } });
  if (!order || order.userId !== userId) return jsonError(t.orderNotFound, 404);
  if (order.status !== "PENDING") return jsonError(t.orderAlreadyProcessed, 400);
  if (order.package.priceUsdCents == null) return jsonError(t.paymentGatewayNotConfigured, 503, { reason: "GATEWAY_NOT_CONFIGURED" });

  const result = await createPaypalOrder(order.id, order.package.priceUsdCents);
  if (!result.success) {
    if (result.reason === "GATEWAY_NOT_CONFIGURED") {
      return jsonError(t.paymentGatewayNotConfigured, 503, { reason: result.reason });
    }
    console.error("PayPal createPaypalOrder failed:", result.detail);
    return jsonError(t.paymentGatewayError, 502, { reason: result.reason });
  }

  return NextResponse.json({ id: result.paypalOrderId });
}
