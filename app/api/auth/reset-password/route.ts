import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPasswordResetToken } from "@/lib/auth";
import { createResetPasswordSchema } from "@/lib/validation";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { authErrors, validationMessages } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const [t, v] = await Promise.all([authErrors(request), validationMessages(request)]);

  const body = await request.json().catch(() => null);
  const parsed = createResetPasswordSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { userId, resetToken, newPassword } = parsed.data;
  const limited = rateLimit(clientKey(request, `reset-password:${userId}`), 5, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError(t.tooManyAttempts, 429);
  }

  const session = await verifyPasswordResetToken(resetToken);
  if (!session || session.userId !== userId) {
    return jsonError(t.invalidOrExpiredResetToken, 401);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return NextResponse.json({ message: t.passwordResetSuccess });
}
