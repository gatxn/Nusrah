import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getNextIncompleteStep, STEP_NUMBER, STEP_ROUTES, type OnboardingStep } from "@/lib/onboarding";

/** Request-memoized so a layout gate and its page body share one query. */
export const getOwnProfile = cache(async (userId: string) => {
  return prisma.profile.findUnique({ where: { userId } });
});

/**
 * Guard for the 3 mandatory step pages: auth + can't skip ahead of the
 * furthest incomplete step. Revisiting an EARLIER, already-completed step
 * (e.g. via "Rudi Nyuma") is allowed — each form re-seeds from the saved
 * profile, so this doubles as "go back and edit". Only jumping past the
 * furthest incomplete step bounces you back to it.
 */
export async function requireOnboardingStep(step: OnboardingStep) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");
  const profile = await getOwnProfile(userId);
  const next = getNextIncompleteStep(profile);
  if (next === null) redirect("/wanachama");
  if (STEP_NUMBER[step] > STEP_NUMBER[next]) redirect(STEP_ROUTES[next]);
  return { userId, profile: profile! };
}

/** Guard for the optional photo page: steps 1-3 must already be done. */
export async function requireOnboardingReady() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");
  const profile = await getOwnProfile(userId);
  const next = getNextIncompleteStep(profile);
  if (next !== null) redirect(STEP_ROUTES[next]);
  return { userId, profile: profile! };
}
