import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { toNotificationView } from "@/lib/notifications";
import { UNAUTHENTICATED } from "@/lib/api";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const [tier, rows] = await Promise.all([
    getEffectiveTier(userId),
    prisma.notification.findMany({
      where: { recipientUserId: userId },
      include: { source: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const notifications = rows.map((n) => toNotificationView(n, tier));
  const unreadCount = rows.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}
