import { prisma } from "@/lib/db";

/**
 * Blocking is bidirectional: if either party has blocked the other, neither
 * should see, message, or be shown on the other's profile. Every place that
 * enforces this (queryMembers, the member detail page, the messages route)
 * calls this instead of re-deriving the OR-both-directions check.
 */
export async function isBlocked(userIdA: string, userIdB: string): Promise<boolean> {
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedUserId: userIdB },
        { blockerId: userIdB, blockedUserId: userIdA },
      ],
    },
    select: { id: true },
  });
  return !!block;
}

/** Every user id that has a block relationship with `userId`, either direction. */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedUserId: userId }] },
    select: { blockerId: true, blockedUserId: true },
  });
  return rows.map((r) => (r.blockerId === userId ? r.blockedUserId : r.blockerId));
}
