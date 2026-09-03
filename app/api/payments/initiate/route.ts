import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { createInitiatePaymentSchema, normalizePhone } from "@/lib/validation";
import { initiateCharge } from "@/lib/payments/gateway";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createInitiatePaymentSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const t = await apiErrors(request);
  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.userId !== userId) return jsonError(t.orderNotFound, 404);
  if (order.status !== "PENDING") {
    return jsonError(t.orderAlreadyProcessed, 400);
  }

  const result = await initiateCharge({
    orderId: order.id,
    amountTzs: order.amountTzs,
    phoneNumber: normalizePhone(parsed.data.phoneNumber),
  });

  if (!result.success) {
    return jsonError(t.paymentGatewayNotConfigured, 503, { reason: result.reason });
  }

  // Reachable only once a real gateway is configured.
  return NextResponse.json({ gatewayRef: result.gatewayRef });
}
