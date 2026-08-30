import type { Notification } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasCapability, type Tier } from "@/lib/tiers";

/**
 * Debounce rule: suppress only while an UNREAD notification from that exact
 * source already exists. Self-resolving — reading it re-arms the next like
 * as a fresh alert, no timestamp math or cleanup job needed.
 */
export async function maybeNotifyProfileLiked(recipientUserId: string, sourceUserId: string) {
  const existingUnread = await prisma.notification.findFirst({
    where: { recipientUserId, sourceUserId, type: "PROFILE_LIKED", isRead: false },
    select: { id: true },
  });
  if (!existingUnread) {
    await prisma.notification.create({
      data: { recipientUserId, sourceUserId, type: "PROFILE_LIKED" },
    });
  }
}

export type NotificationView = {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  text: string;
  linkHref: string | null;
  sourceUserId: string | null;
};

type NotificationWithSource = Notification & { source: { id: string; name: string } | null };

/**
 * Tier-gates identity BEFORE the JSON is built — a locked-tier viewer's
 * response never contains the liker's name or id, not just CSS-hidden.
 */
export function toNotificationView(n: NotificationWithSource, tier: Tier): NotificationView {
  const base = { id: n.id, type: n.type, isRead: n.isRead, createdAt: n.createdAt.toISOString() };

  if (n.type === "PROFILE_LIKED") {
    if (hasCapability(tier, "canSeeWhoLikedYou") && n.source) {
      return {
        ...base,
        text: `${n.source.name} amependa wasifu wako`,
        linkHref: `/wanachama/${n.source.id}`,
        sourceUserId: n.source.id,
      };
    }
    return {
      ...base,
      text: "Mtu mmoja amependa wasifu wako. Boresha kifurushi chako kuona ni nani.",
      linkHref: "/kuwa-mwanachama",
      sourceUserId: null,
    };
  }

  return { ...base, text: "Una arifa mpya", linkHref: null, sourceUserId: null };
}
