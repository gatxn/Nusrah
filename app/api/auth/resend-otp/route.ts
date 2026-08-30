import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createAndSendOtp, OtpDeliveryNotConfiguredError } from "@/lib/otp";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { authErrors } from "@/lib/i18n/api";

const schema = z.object({ userId: z.string().min(1) });

export async function POST(request: NextRequest) {
  const t = await authErrors(request);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const limited = rateLimit(clientKey(request, `resend-otp:${parsed.data.userId}`), 3, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError(t.resendTooMany, 429);
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return jsonError(t.userNotFound, 404);
  if (user.otpVerified) return jsonError(t.alreadyVerified, 400);
  if (!user.email) {
    return jsonError(t.noEmailOnFile, 400);
  }

  let devCode: string | undefined;
  try {
    ({ devCode } = await createAndSendOtp(user.id, user.email, "REGISTER"));
  } catch (err) {
    if (err instanceof OtpDeliveryNotConfiguredError) {
      return jsonError(t.resendServiceDown, 503);
    }
    throw err;
  }

  return NextResponse.json({
    message: t.resendSuccess,
    ...(devCode ? { devCode, devNote: t.devNote } : {}),
  });
}
