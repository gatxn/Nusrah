import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { onboardingLifeSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";
import { nextStepRoute } from "@/lib/onboarding";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const body = await request.json().catch(() => null);
  const parsed = onboardingLifeSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return jsonError("Wasifu haujapatikana", 404);

  const updated = await prisma.profile.update({
    where: { userId },
    data: parsed.data,
  });

  return NextResponse.json({ nextStep: nextStepRoute(updated) });
}
