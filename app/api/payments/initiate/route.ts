import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { initiatePaymentSchema, normalizePhone } from "@/lib/validation";
import { initiateCharge } from "@/lib/payments/gateway";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const body = await request.json().catch(() => null);
  const parsed = initiatePaymentSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.userId !== userId) return jsonError("Agizo halipatikani", 404);
  if (order.status !== "PENDING") {
    return jsonError("Agizo hili tayari limeshughulikiwa", 400);
  }

  const result = await initiateCharge({
    orderId: order.id,
    amountTzs: order.amountTzs,
    phoneNumber: normalizePhone(parsed.data.phoneNumber),
  });

  if (!result.success) {
    return jsonError(
      "Malipo ya mtandao wa simu yanasubiri usanidi wa mwisho. Tutakujulisha mara tu yatakapopatikana.",
      503,
      { reason: result.reason }
    );
  }

  // Reachable only once a real gateway is configured.
  return NextResponse.json({ gatewayRef: result.gatewayRef });
}
