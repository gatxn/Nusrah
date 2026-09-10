import type { Notification } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hasCapability, type Tier } from "@/lib/tiers";

/**
 * Debounce rule: suppress only while an UNREAD notification from that exact
 * source+type already exists. Self-resolving — reading it re-arms the next
 * one as a fresh alert, no timestamp math or cleanup job needed.
 */
async function maybeNotify(recipientUserId: string, sourceUserId: string, type: string) {
  const existingUnread = await prisma.notification.findFirst({
    where: { recipientUserId, sourceUserId, type, isRead: false },
    select: { id: true },
  });
  if (!existingUnread) {
    await prisma.notification.create({ data: { recipientUserId, sourceUserId, type } });
  }
}

export async function maybeNotifyProfileLiked(recipientUserId: string, sourceUserId: string) {
  return maybeNotify(recipientUserId, sourceUserId, "PROFILE_LIKED");
}

export async function maybeNotifyMessageReceived(recipientUserId: string, sourceUserId: string) {
  return maybeNotify(recipientUserId, sourceUserId, "MESSAGE_RECEIVED");
}

export async function maybeNotifyMissedCall(
  recipientUserId: string,
  sourceUserId: string,
  callType: "VOICE" | "VIDEO"
) {
  return maybeNotify(recipientUserId, sourceUserId, callType === "VIDEO" ? "MISSED_VIDEO_CALL" : "MISSED_VOICE_CALL");
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

  if (n.type === "MESSAGE_RECEIVED") {
    if (n.source) {
      return {
        ...base,
        text: `${n.source.name} amekutumia ujumbe`,
        linkHref: `/ujumbe/${n.source.id}`,
        sourceUserId: n.source.id,
      };
    }
    return { ...base, text: "Umepata ujumbe mpya", linkHref: "/ujumbe", sourceUserId: null };
  }

  if (n.type === "MISSED_VOICE_CALL" || n.type === "MISSED_VIDEO_CALL") {
    const label = n.type === "MISSED_VIDEO_CALL" ? "simu ya video" : "simu ya sauti";
    if (n.source) {
      return {
        ...base,
        text: `Umekosa ${label} kutoka kwa ${n.source.name}`,
        linkHref: `/ujumbe/${n.source.id}`,
        sourceUserId: n.source.id,
      };
    }
    return { ...base, text: `Umekosa ${label}`, linkHref: null, sourceUserId: null };
  }

  return { ...base, text: "Una arifa mpya", linkHref: null, sourceUserId: null };
}
