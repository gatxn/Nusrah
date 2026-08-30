import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED } from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const callerId = await getSessionUserId();
  if (!callerId) return UNAUTHENTICATED();
  const { userId: otherUserId } = await params;

  // receiverId: callerId comes from the session, not the URL param —
  // ownership-in-where, same pattern as notifications/[id]/read.
  await prisma.message.updateMany({
    where: { senderId: otherUserId, receiverId: callerId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
