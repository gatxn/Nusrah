import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createOrderSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const pkg = await prisma.package.findUnique({ where: { tier: parsed.data.packageTier } });
  if (!pkg) {
    const t = await apiErrors(request);
    return jsonError(t.packageNotFound, 404);
  }

  const order = await prisma.order.create({
    data: { userId, packageId: pkg.id, amountTzs: pkg.priceTzs, status: "PENDING" },
  });

  // FREE tier needs no payment — activate immediately, no gateway involved.
  if (pkg.priceTzs === 0) {
    const expiryDate = new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
      prisma.subscription.upsert({
        where: { userId },
        create: { userId, packageId: pkg.id, status: "ACTIVE", expiryDate },
        update: { packageId: pkg.id, status: "ACTIVE", expiryDate, startDate: new Date() },
      }),
    ]);
    return NextResponse.json(
      { orderId: order.id, activated: true, message: "Kifurushi cha FREE kimewashwa" },
      { status: 201 }
    );
  }

  return NextResponse.json(
    {
      orderId: order.id,
      activated: false,
      amountTzs: pkg.priceTzs,
      packageName: pkg.name,
      message: "Agizo limeundwa. Endelea kulipa ili kuwasha kifurushi.",
    },
    { status: 201 }
  );
}
