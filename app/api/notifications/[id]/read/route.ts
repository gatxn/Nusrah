import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED } from "@/lib/api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();
  const { id } = await params;

  // updateMany with BOTH id and recipientUserId in the where clause is the
  // atomic way to enforce ownership — no separate find-then-check-then-update
  // race, and no way to mark someone else's notification read by guessing an id.
  await prisma.notification.updateMany({
    where: { id, recipientUserId: userId },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
