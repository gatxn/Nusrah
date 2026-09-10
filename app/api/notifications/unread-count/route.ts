import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED } from "@/lib/api";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const [unreadCount, unreadMessageCount] = await Promise.all([
    prisma.notification.count({ where: { recipientUserId: userId, isRead: false } }),
    prisma.message.count({ where: { receiverId: userId, isRead: false } }),
  ]);

  return NextResponse.json({ unreadCount, unreadMessageCount });
}
