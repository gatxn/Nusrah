import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, hashPassword, verifyPassword } from "@/lib/auth";
import { createChangePasswordSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

export async function PATCH(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createChangePasswordSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const currentIsValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentIsValid) {
    const t = await apiErrors(request);
    return jsonError(t.invalidCurrentPassword, 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
