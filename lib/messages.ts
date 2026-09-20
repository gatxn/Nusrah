import { prisma } from "@/lib/db";
import { hasCapability, type Tier } from "@/lib/tiers";
import { getBlockedUserIds } from "@/lib/blocks";

// Demo-scale in-application reduction over a capped, sorted scan — same
// precedent as queryMembers in lib/profiles.ts. senderId/receiverId are two
// separate columns, so there's no single Prisma `distinct` that gives "one
// row per other-party."
const CONVERSATION_SCAN_CAP = 500;

export type ConversationPreview = {
  otherUserId: string;
  otherUserName: string;
  otherUserHasPhoto: boolean;
  lastMessageBody: string | null;
  lastMessageDeleted: boolean;
  lastMessageAt: string;
  lastMessageWasMine: boolean;
  unreadCount: number;
};

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const [rows, unreadGroups] = await Promise.all([
    prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { sentAt: "desc" },
      take: CONVERSATION_SCAN_CAP,
      select: {
        senderId: true,
        receiverId: true,
        body: true,
        isDeleted: true,
        sentAt: true,
        sender: { select: { name: true } },
        receiver: { select: { name: true } },
      },
    }),
    // Uncapped, so unread counts stay correct even for a conversation whose
    // preview got trimmed out of the capped scan above.
    prisma.message.groupBy({
      by: ["senderId"],
      where: { receiverId: userId, isRead: false },
      _count: { _all: true },
    }),
  ]);

  const unreadBySender = new Map(unreadGroups.map((g) => [g.senderId, g._count._all]));
  const blockedIds = new Set(await getBlockedUserIds(userId));

  const seen = new Set<string>();
  const previews: Omit<ConversationPreview, "otherUserHasPhoto">[] = [];
  for (const row of rows) {
    const isMine = row.senderId === userId;
    const otherUserId = isMine ? row.receiverId : row.senderId;
    if (seen.has(otherUserId) || blockedIds.has(otherUserId)) continue;
    seen.add(otherUserId);
    previews.push({
      otherUserId,
      otherUserName: isMine ? row.receiver.name : row.sender.name,
      lastMessageBody: row.isDeleted ? null : row.body,
      lastMessageDeleted: row.isDeleted,
      lastMessageAt: row.sentAt.toISOString(),
      lastMessageWasMine: isMine,
      unreadCount: unreadBySender.get(otherUserId) ?? 0,
    });
  }
  if (previews.length === 0) return [];

  // Single batched lookup — avoids N+1 on photo-availability across partners.
  // photoUpdatedAt only, never photoEnc, so this never pulls the BLOB.
  const photoRows = await prisma.profile.findMany({
    where: { userId: { in: previews.map((p) => p.otherUserId) } },
    select: { userId: true, photoUpdatedAt: true },
  });
  const hasPhotoById = new Map(photoRows.map((p) => [p.userId, !!p.photoUpdatedAt]));

  return previews.map((p) => ({ ...p, otherUserHasPhoto: hasPhotoById.get(p.otherUserId) ?? false }));
}

export type ThreadMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string | null;
  sentAt: string;
  isRead: boolean;
  editedAt: string | null;
  isDeleted: boolean;
};

/** Backs both GET /api/messages?with= and the SSR initial load on the thread page. */
export async function getThreadMessages(userId: string, otherUserId: string): Promise<ThreadMessage[]> {
  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { sentAt: "asc" },
  });
  return rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    receiverId: m.receiverId,
    // Never sent over the wire once deleted — the body column is kept in the
    // DB (see the schema comment) but the API itself should behave as if it
    // were gone, not just rely on the client to hide it.
    body: m.isDeleted ? null : m.body,
    sentAt: m.sentAt.toISOString(),
    isRead: m.isRead,
    editedAt: m.editedAt ? m.editedAt.toISOString() : null,
    isDeleted: m.isDeleted,
  }));
}

/** Has the other person messaged me first? Determines initiate vs reply. */
export async function determineIsReply(viewerId: string, otherUserId: string): Promise<boolean> {
  const priorIncoming = await prisma.message.findFirst({
    where: { senderId: otherUserId, receiverId: viewerId },
    select: { id: true },
  });
  return Boolean(priorIncoming);
}

export type SendPermission = { canSend: boolean; isReply: boolean };

/**
 * Single source of truth for "can X message Y" — shared by the POST route
 * (enforcement) and the thread page (so the composer can explain itself
 * before the user even types). Callers own the user-facing copy for a
 * denied result themselves, since that copy is locale-dependent and this
 * file has no request/locale context.
 */
export async function getSendPermission(
  viewerId: string,
  otherUserId: string,
  tier: Tier
): Promise<SendPermission> {
  const isReply = await determineIsReply(viewerId, otherUserId);
  const canSend = isReply ? hasCapability(tier, "canReplyToMessage") : hasCapability(tier, "canInitiateMessage");
  return { canSend, isReply };
}
