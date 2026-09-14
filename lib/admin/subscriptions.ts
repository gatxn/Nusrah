import { prisma } from "@/lib/db";

export type AdminSubscriptionResult =
  | { ok: true }
  | { ok: false; reason: "USER_NOT_FOUND" | "PACKAGE_NOT_FOUND" };

// A direct admin override — no Order, no Transaction, deliberately outside
// the payment pipeline entirely. This is not "confirming a payment" (that's
// confirmOrderManually in lib/admin/orders.ts, which tags a real order's
// Transaction manual_admin); this is granting or changing a member's plan
// with no payment involved at all, so it must never touch revenue figures
// the same way a manual_admin Transaction intentionally does. Covers the
// same real need as the "remove premium from Gabriel" one-off script used
// earlier this project, now as a proper, repeatable admin action.
export async function setUserPlan(userId: string, packageId: string): Promise<AdminSubscriptionResult> {
  const [user, pkg] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.package.findUnique({ where: { id: packageId } }),
  ]);
  if (!user) return { ok: false, reason: "USER_NOT_FOUND" };
  if (!pkg) return { ok: false, reason: "PACKAGE_NOT_FOUND" };

  const expiryDate = new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, packageId, status: "ACTIVE", expiryDate },
    update: { packageId, status: "ACTIVE", expiryDate, startDate: new Date() },
  });

  return { ok: true };
}

export async function removeUserPlan(userId: string): Promise<AdminSubscriptionResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, reason: "USER_NOT_FOUND" };

  await prisma.subscription.deleteMany({ where: { userId } });
  return { ok: true };
}
