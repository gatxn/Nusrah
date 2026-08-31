import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { getThreadMessages, getSendPermission } from "@/lib/messages";
import { sendMessageSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND } from "@/lib/api";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const withUserId = request.nextUrl.searchParams.get("with");
  if (!withUserId) return jsonError("Query param 'with' inahitajika", 400);
  if (await isBlocked(userId, withUserId)) return NOT_FOUND();

  const messages = await getThreadMessages(userId, withUserId);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const body = await request.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  if (parsed.data.receiverId === userId) {
    return jsonError("Huwezi kujitumia ujumbe", 400);
  }

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { gender: true } }),
    prisma.profile.findUnique({ where: { userId: parsed.data.receiverId }, select: { gender: true } }),
  ]);
  // Gender-visibility rule, enforced here too — mirrors app/api/favorites/route.ts's
  // POST, since this route previously only checked the receiver existed, not
  // whether the caller was ever allowed to see/message them.
  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND();
  if (await isBlocked(userId, parsed.data.receiverId)) return NOT_FOUND();

  const tier = await getEffectiveTier(userId);
  const { canSend, reason } = await getSendPermission(userId, parsed.data.receiverId, tier);
  if (!canSend) return FORBIDDEN(reason ?? undefined);

  const message = await prisma.message.create({
    data: { senderId: userId, receiverId: parsed.data.receiverId, body: parsed.data.body },
  });

  return NextResponse.json({ message }, { status: 201 });
}
