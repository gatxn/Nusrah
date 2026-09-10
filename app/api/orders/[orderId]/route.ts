import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

// Ownership-checked status read, used by PaymentForm's poll while waiting
// for the AzamPay phone-prompt confirmation (no more redirect-back flow —
// the customer stays on our page the whole time, unlike PalmPesa's hosted
// checkout redirect).
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, status: true } });
  if (!order || order.userId !== userId) return NOT_FOUND(request);

  return NextResponse.json({ status: order.status });
}
