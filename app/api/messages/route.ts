import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { getThreadMessages, getSendPermission } from "@/lib/messages";
import { createSendMessageSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND } from "@/lib/api";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const withUserId = request.nextUrl.searchParams.get("with");
  if (!withUserId) {
    const t = await apiErrors(request);
    return jsonError(t.withParamRequired, 400);
  }
  if (await isBlocked(userId, withUserId)) return NOT_FOUND(request);

  const messages = await getThreadMessages(userId, withUserId);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createSendMessageSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  if (parsed.data.receiverId === userId) {
    const t = await apiErrors(request);
    return jsonError(t.cannotMessageSelf, 400);
  }

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { gender: true } }),
    prisma.profile.findUnique({ where: { userId: parsed.data.receiverId }, select: { gender: true } }),
  ]);
  // Gender-visibility rule, enforced here too — mirrors app/api/favorites/route.ts's
  // POST, since this route previously only checked the receiver existed, not
  // whether the caller was ever allowed to see/message them.
  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND(request);
  if (await isBlocked(userId, parsed.data.receiverId)) return NOT_FOUND(request);

  const tier = await getEffectiveTier(userId);
  const { canSend, isReply } = await getSendPermission(userId, parsed.data.receiverId, tier);
  if (!canSend) {
    const t = await apiErrors(request);
    return FORBIDDEN(request, isReply ? t.cannotReplyToMessage : t.cannotInitiateMessage);
  }

  const message = await prisma.message.create({
    data: { senderId: userId, receiverId: parsed.data.receiverId, body: parsed.data.body },
  });

  return NextResponse.json({ message }, { status: 201 });
}
