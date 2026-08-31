import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { onboardingGuardianSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";
import { STEP_ROUTES } from "@/lib/onboarding";

// Guardian (Step 4) is optional and comes after the 3 mandatory steps, so the
// next stop is always Step 5 (photo) — unlike the mandatory steps, this
// can't use nextStepRoute(), which would just point back at "guardian".
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const body = await request.json().catch(() => null);
  const parsed = onboardingGuardianSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) return jsonError("Wasifu haujapatikana", 404);

  await prisma.profile.update({
    where: { userId },
    data: parsed.data,
  });

  return NextResponse.json({ nextStep: STEP_ROUTES.photo });
}
