import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { initiateCharge, AZAMPAY_PROVIDERS, type AzamPayProvider } from "@/lib/payments/gateway";
import { normalizePhone, isPhoneNumber } from "@/lib/validation";
import { jsonError, UNAUTHENTICATED } from "@/lib/api";
import { apiErrors } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const t = await apiErrors(request);
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : null;
  if (!orderId) return jsonError(t.notFound, 400);

  const phoneNumberRaw = typeof body?.phoneNumber === "string" ? body.phoneNumber : null;
  if (!phoneNumberRaw || !isPhoneNumber(phoneNumberRaw)) {
    return jsonError(t.invalidPhoneNumber, 400);
  }
  const phoneNumber = normalizePhone(phoneNumberRaw);

  const provider =
    typeof body?.provider === "string" && AZAMPAY_PROVIDERS.includes(body.provider as AzamPayProvider)
      ? (body.provider as AzamPayProvider)
      : null;
  if (!provider) return jsonError(t.invalidProvider, 400);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) return jsonError(t.orderNotFound, 404);
  if (order.status !== "PENDING") return jsonError(t.orderAlreadyProcessed, 400);

  const result = await initiateCharge({
    orderId: order.id,
    amountTzs: order.amountTzs,
    phoneNumber,
    provider,
  });

  if (!result.success) {
    if (result.reason === "GATEWAY_NOT_CONFIGURED") {
      return jsonError(t.paymentGatewayNotConfigured, 503, { reason: result.reason });
    }
    console.error("AzamPay initiateCharge failed:", result.detail);
    return jsonError(t.paymentGatewayError, 502, { reason: result.reason });
  }

  return NextResponse.json({ ok: true });
}
