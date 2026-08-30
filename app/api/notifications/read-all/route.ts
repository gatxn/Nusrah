import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED } from "@/lib/api";

export async function PATCH() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  await prisma.notification.updateMany({
    where: { recipientUserId: userId, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
