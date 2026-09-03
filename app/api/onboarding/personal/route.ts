import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { createOnboardingPersonalSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";
import { nextStepRoute } from "@/lib/onboarding";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createOnboardingPersonalSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    const t = await apiErrors(request);
    return jsonError(t.profileNotFound, 404);
  }

  const updated = await prisma.profile.update({
    where: { userId },
    data: parsed.data,
  });

  return NextResponse.json({ nextStep: nextStepRoute(updated) });
}
