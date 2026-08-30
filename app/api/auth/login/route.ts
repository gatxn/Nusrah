import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { createLoginSchema, normalizePhone, normalizeEmail, isPhoneNumber } from "@/lib/validation";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { getNextIncompleteStep, STEP_ROUTES } from "@/lib/onboarding";
import { getOwnProfile } from "@/lib/onboarding-server";
import { authErrors, validationMessages } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const [t, v] = await Promise.all([authErrors(request), validationMessages(request)]);

  const body = await request.json().catch(() => null);
  const parsed = createLoginSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { identifier } = parsed.data;
  const limited = rateLimit(clientKey(request, `login:${identifier}`), 8, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError(t.tooManyAttempts, 429);
  }

  const user = isPhoneNumber(identifier)
    ? await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } })
    : await prisma.user.findUnique({ where: { email: normalizeEmail(identifier) } });
  if (!user) return jsonError(t.invalidCredentials, 401);

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) return jsonError(t.invalidCredentials, 401);

  if (!user.otpVerified) {
    return jsonError(t.otpRequired, 403, {
      userId: user.id,
      requiresOtp: true,
    });
  }

  await setSessionCookie(user.id);

  // Server-authoritative redirect target — see the matching comment in
  // app/api/auth/verify-otp/route.ts for why this must be a hard navigation
  // on the client, not router.push.
  const profile = await getOwnProfile(user.id);
  const next = getNextIncompleteStep(profile);
  const redirectTo = next ? STEP_ROUTES[next] : "/wanachama";

  return NextResponse.json({ message: t.loginSuccess, userId: user.id, name: user.name, redirectTo });
}
