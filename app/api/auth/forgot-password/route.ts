import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAndSendOtp } from "@/lib/otp";
import { createForgotPasswordSchema, normalizePhone, normalizeEmail, isPhoneNumber } from "@/lib/validation";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { authErrors, validationMessages } from "@/lib/i18n/api";

// Entirely separate from /api/auth/register: uses OTP purpose
// "RESET_PASSWORD" (lib/otp.ts), which createAndSendOtp/verifyOtp already
// scope by purpose+userId, so a code sent here can never be consumed by
// (or collide with) the registration OTP flow, and vice versa.
export async function POST(request: NextRequest) {
  const [t, v] = await Promise.all([authErrors(request), validationMessages(request)]);

  const body = await request.json().catch(() => null);
  const parsed = createForgotPasswordSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { identifier } = parsed.data;
  const limited = rateLimit(clientKey(request, `forgot-password:${identifier}`), 5, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError(t.tooManyAttempts, 429);
  }

  const user = isPhoneNumber(identifier)
    ? await prisma.user.findUnique({ where: { phone: normalizePhone(identifier) } })
    : await prisma.user.findUnique({ where: { email: normalizeEmail(identifier) } });
  if (!user) return jsonError(t.userNotFound, 404);
  if (!user.email) return jsonError(t.noEmailOnFile, 400);

  let devCode: string | undefined;
  try {
    ({ devCode } = await createAndSendOtp(user.id, user.email, "RESET_PASSWORD"));
  } catch (err) {
    console.error("OTP delivery failed during password reset request:", err);
    return jsonError(t.resendServiceDown, 503);
  }

  return NextResponse.json({
    userId: user.id,
    message: t.registerSuccess,
    ...(devCode ? { devCode, devNote: t.devNote } : {}),
  });
}
