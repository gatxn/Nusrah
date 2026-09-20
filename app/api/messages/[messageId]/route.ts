import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { createEditMessageSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND } from "@/lib/api";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

/** Only the original sender may edit or delete — never the receiver. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);
  const { messageId } = await params;

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createEditMessageSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return NOT_FOUND(request);
  if (message.senderId !== userId) return FORBIDDEN(request);
  if (message.isDeleted) {
    const t = await apiErrors(request);
    return jsonError(t.messageAlreadyDeleted, 400);
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { body: parsed.data.body, editedAt: new Date() },
  });

  return NextResponse.json({
    message: {
      id: updated.id,
      body: updated.body,
      editedAt: updated.editedAt?.toISOString() ?? null,
      isDeleted: false,
    },
  });
}

/** Soft delete (see schema comment on Message.isDeleted) — idempotent if already deleted. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);
  const { messageId } = await params;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return NOT_FOUND(request);
  if (message.senderId !== userId) return FORBIDDEN(request);

  if (!message.isDeleted) {
    await prisma.message.update({ where: { id: messageId }, data: { isDeleted: true } });
  }

  return NextResponse.json({ isDeleted: true });
}
