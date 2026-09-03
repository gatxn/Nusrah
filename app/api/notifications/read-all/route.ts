import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED } from "@/lib/api";

export async function PATCH(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  await prisma.notification.updateMany({
    where: { recipientUserId: userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
