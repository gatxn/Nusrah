import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { createOnboardingLifeSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";
import { nextStepRoute, isOnboardingComplete } from "@/lib/onboarding";
import { validationMessages, apiErrors } from "@/lib/i18n/api";
import { createAdminAlert } from "@/lib/admin/alerts";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createOnboardingLifeSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile) {
    const t = await apiErrors(request);
    return jsonError(t.profileNotFound, 404);
  }

  const wasComplete = isOnboardingComplete(profile);

  const updated = await prisma.profile.update({
    where: { userId },
    data: parsed.data,
  });

  if (!wasComplete && isOnboardingComplete(updated)) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (user) {
      await createAdminAlert("NEW_REGISTRATION", `${user.name} completed registration`, `/admin/users/${userId}`);
    }
  }

  return NextResponse.json({ nextStep: nextStepRoute(updated) });
}
