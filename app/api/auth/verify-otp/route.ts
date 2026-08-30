import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { createVerifyOtpSchema } from "@/lib/validation";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { getNextIncompleteStep, STEP_ROUTES } from "@/lib/onboarding";
import { getOwnProfile } from "@/lib/onboarding-server";
import { authErrors, validationMessages } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const [t, v] = await Promise.all([authErrors(request), validationMessages(request)]);
  const reasonMessages: Record<string, string> = {
    NOT_FOUND: t.codeNotFound,
    EXPIRED: t.codeExpired,
    TOO_MANY_ATTEMPTS: t.tooManyOtpAttempts,
    INVALID_CODE: t.invalidCode,
  };

  const body = await request.json().catch(() => null);
  const parsed = createVerifyOtpSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const limited = rateLimit(clientKey(request, `otp:${parsed.data.userId}`), 8, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError(t.tooManyAttempts, 429);
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return jsonError(t.userNotFound, 404);

  const result = await verifyOtp(user.id, "REGISTER", parsed.data.code);

  if (!result.ok) {
    return jsonError(reasonMessages[result.reason], 400, { reason: result.reason });
  }

  if (!user.otpVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { otpVerified: true } });
  }

  await setSessionCookie(user.id);

  // Server-authoritative redirect target: the client does a hard navigation
  // to this URL (not router.push) so the destination is always rendered
  // fresh with the just-set session cookie — a client-side push here can
  // land on a stale cached render of a shared layout (e.g. [locale]/(main)/
  // layout.tsx) from before the user was authenticated, silently skipping
  // the onboarding gate. See lib/onboarding.ts's getNextIncompleteStep.
  const profile = await getOwnProfile(user.id);
  const next = getNextIncompleteStep(profile);
  const redirectTo = next ? STEP_ROUTES[next] : "/wanachama";

  return NextResponse.json({ message: t.verifiedSuccess, redirectTo });
}
