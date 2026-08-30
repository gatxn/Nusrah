import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { devActivateSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";

// Dev/test-only utility: lets a paid tier be activated locally WITHOUT going
// through the payment gateway, so tier-gated features (§4.4) can be tested
// before real gateway credentials are available. This is intentionally
// separate from — and never part of — the production activation path in
// app/api/payments/webhook/route.ts, which is the only place real paid
// access is ever granted.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Not available", 404);
  }

  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const body = await request.json().catch(() => null);
  const parsed = devActivateSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  if (parsed.data.userId !== userId) {
    return jsonError("Dev tool inaweza tu kuwasha akaunti yako mwenyewe", 403);
  }

  const pkg = await prisma.package.findUnique({ where: { tier: parsed.data.packageTier } });
  if (!pkg) return jsonError("Kifurushi hakipatikani", 404);

  const expiryDate = new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000);
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, packageId: pkg.id, status: "ACTIVE", expiryDate },
    update: { packageId: pkg.id, status: "ACTIVE", expiryDate, startDate: new Date() },
  });

  return NextResponse.json({ message: `Tier ${pkg.tier} imewashwa (dev mode)` });
}
