import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createAndSendOtp, OtpDeliveryNotConfiguredError } from "@/lib/otp";
import { createRegisterSchema, normalizePhone, normalizeEmail } from "@/lib/validation";
import { jsonError, zodError } from "@/lib/api";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { authErrors, validationMessages } from "@/lib/i18n/api";

export async function POST(request: NextRequest) {
  const [t, v] = await Promise.all([authErrors(request), validationMessages(request)]);

  const limited = rateLimit(clientKey(request, "register"), 5, 15 * 60 * 1000);
  if (!limited.allowed) {
    return jsonError(t.tooManyAttempts, 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = createRegisterSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { name, password, gender } = parsed.data;
  const phone = normalizePhone(parsed.data.phone);
  const email = normalizeEmail(parsed.data.email);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, { email }] },
  });
  if (existing) {
    return jsonError(t.duplicateAccount, 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      passwordHash,
      profile: { create: { gender } },
    },
  });

  let devCode: string | undefined;
  try {
    ({ devCode } = await createAndSendOtp(user.id, email, "REGISTER"));
  } catch (err) {
    if (err instanceof OtpDeliveryNotConfiguredError) {
      await prisma.user.delete({ where: { id: user.id } });
      return jsonError(t.otpServiceDown, 503);
    }
    throw err;
  }

  return NextResponse.json(
    {
      userId: user.id,
      message: t.registerSuccess,
      ...(devCode ? { devCode, devNote: t.devNote } : {}),
    },
    { status: 201 }
  );
}
