import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { signPasswordResetToken } from "@/lib/auth";
import { createVerifyOtpSchema } from "@/lib/validation";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { authErrors, validationMessages } from "@/lib/i18n/api";

// Separate from /api/auth/verify-otp: checks the "RESET_PASSWORD"-purpose
// OTP only, and never touches otpVerified or issues a session — a
// successful check here only proves possession, via a short-lived
// single-purpose reset token the next step (reset-password) requires.
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

  const limited = rateLimit(clientKey(request, `reset-otp:${parsed.data.userId}`), 8, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError(t.tooManyAttempts, 429);
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return jsonError(t.userNotFound, 404);

  const result = await verifyOtp(user.id, "RESET_PASSWORD", parsed.data.code);
  if (!result.ok) {
    return jsonError(reasonMessages[result.reason], 400, { reason: result.reason });
  }

  const resetToken = await signPasswordResetToken(user.id);
  return NextResponse.json({ resetToken });
}
