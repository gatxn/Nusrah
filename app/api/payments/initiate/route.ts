import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { initiateCharge } from "@/lib/payments/gateway";
import { jsonError, UNAUTHENTICATED } from "@/lib/api";
import { apiErrors, localeFromRequest } from "@/lib/i18n/api";
import { localeHref } from "@/lib/i18n/href";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const t = await apiErrors(request);
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : null;
  if (!orderId) return jsonError(t.notFound, 400);

  const [order, user] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!order || order.userId !== userId) return jsonError(t.orderNotFound, 404);
  if (order.status !== "PENDING") return jsonError(t.orderAlreadyProcessed, 400);
  if (!user?.email) return jsonError(t.emailRequiredForPayment, 400);

  const appUrl = (process.env.APP_URL ?? request.nextUrl.origin).replace(/\/$/, "");
  const locale = localeFromRequest(request);
  const orderPath = localeHref(locale, `/malipo/${order.id}`);

  const result = await initiateCharge({
    orderId: order.id,
    amountTzs: order.amountTzs,
    buyerName: user.name,
    buyerEmail: user.email,
    buyerPhone: user.phone,
    webhookUrl: `${appUrl}/api/payments/webhook`,
    redirectUrl: `${appUrl}${orderPath}?paid=1`,
    cancelUrl: `${appUrl}${orderPath}?cancelled=1`,
  });

  if (!result.success) {
    if (result.reason === "GATEWAY_NOT_CONFIGURED") {
      return jsonError(t.paymentGatewayNotConfigured, 503, { reason: result.reason });
    }
    console.error("PalmPesa initiateCharge failed:", result.detail);
    // TEMPORARY: surfacing `detail` in the response itself (visible via the
    // browser's Network tab) while diagnosing a live-server-only failure —
    // this host's Passenger/Node logs aren't easily reachable. Remove this
    // once the real cause is confirmed; it's diagnostic-only, not user copy.
    return jsonError(t.paymentGatewayError, 502, { reason: result.reason, detail: result.detail });
  }

  return NextResponse.json({ checkoutUrl: result.checkoutUrl });
}
