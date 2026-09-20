import { prisma } from "@/lib/db";
import { TIER_CAPABILITIES, type Tier } from "@/lib/tiers";
import { startOfToday } from "@/lib/profile-views";

export type FavoriteAccess =
  | { allowed: true }
  | { allowed: false; limit: number; usedToday: number };

/**
 * Reuses the same per-tier number as lib/tiers.ts's profileViewLimit — the
 * daily allowance for NEW likes matches the daily allowance for NEW profile
 * opens, per the user's explicit request. A profile already favorited is
 * always a free, idempotent action (never re-checked against the limit);
 * un-liking then re-liking the same profile later the same day does count as
 * a new like, same as the analogous profile-view edge case.
 */
export async function checkFavoriteAccess(viewerId: string, targetId: string, tier: Tier): Promise<FavoriteAccess> {
  const limit = TIER_CAPABILITIES[tier].profileViewLimit;

  const alreadyFavorited = await prisma.favorite.findUnique({
    where: { userId_favoritedUserId: { userId: viewerId, favoritedUserId: targetId } },
    select: { userId: true },
  });
  if (alreadyFavorited) return { allowed: true };

  if (!Number.isFinite(limit)) return { allowed: true };

  const usedToday = await prisma.favorite.count({
    where: { userId: viewerId, createdAt: { gte: startOfToday() } },
  });
  if (usedToday < limit) return { allowed: true };

  return { allowed: false, limit, usedToday };
}
