import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, verifyPassword, clearSessionCookie } from "@/lib/auth";
import { createDeleteAccountSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED } from "@/lib/api";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

// Real, permanent deletion — not a soft delete or deactivation. Requires
// password re-entry plus a typed "FUTA" confirmation (see
// lib/validation.ts's createDeleteAccountSchema) since this can't be undone.
export async function DELETE(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createDeleteAccountSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const passwordIsValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordIsValid) {
    const t = await apiErrors(request);
    return jsonError(t.invalidPassword, 400);
  }

  // Transaction has no cascade from Order (only Order -> User cascades), so
  // a paid user's Transaction row would otherwise block the whole delete
  // with a foreign-key violation the moment Order tried to cascade away.
  // Clearing it first, atomically with the delete, avoids that without
  // needing a schema change.
  await prisma.$transaction(
    [
      prisma.transaction.deleteMany({ where: { order: { userId } } }),
      prisma.user.delete({ where: { id: userId } }),
    ],
    // Neon's pooled connection occasionally takes longer than Prisma's 5s
    // default to hand over a transaction slot; this is a safe, idempotent
    // operation to retry, but a longer timeout avoids making that the norm.
    { timeout: 15000 }
  );

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
