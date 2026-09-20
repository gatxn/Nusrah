import { prisma } from "@/lib/db";
import { TIER_CAPABILITIES, type Tier } from "@/lib/tiers";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Distinct profiles this viewer has already opened today — re-opening any of these is always free. */
export async function getTodayViewedUserIds(viewerId: string): Promise<Set<string>> {
  const rows = await prisma.profileView.findMany({
    where: { viewerId, viewedAt: { gte: startOfToday() } },
    select: { viewedUserId: true },
    distinct: ["viewedUserId"],
  });
  return new Set(rows.map((r) => r.viewedUserId));
}

export type ViewAccess =
  | { allowed: true; alreadyViewedToday: boolean }
  | { allowed: false; limit: number; usedToday: number };

/**
 * The real gate for lib/tiers.ts's profileViewLimit ("per day; Infinity for
 * unlimited"). Checked at the one place a profile is actually opened
 * (app/[locale]/(main)/(app)/wanachama/[userId]/page.tsx) — not at the
 * browse-list level, which shows the full matching pool regardless of tier.
 */
export async function checkViewAccess(viewerId: string, targetId: string, tier: Tier): Promise<ViewAccess> {
  const limit = TIER_CAPABILITIES[tier].profileViewLimit;
  const viewedToday = await getTodayViewedUserIds(viewerId);

  if (viewedToday.has(targetId)) return { allowed: true, alreadyViewedToday: true };
  if (!Number.isFinite(limit) || viewedToday.size < limit) return { allowed: true, alreadyViewedToday: false };

  return { allowed: false, limit, usedToday: viewedToday.size };
}

/** Records today's first view of this profile — a no-op if already recorded today, so revisits never inflate the count. */
export async function recordProfileView(viewerId: string, targetId: string): Promise<void> {
  const existing = await prisma.profileView.findFirst({
    where: { viewerId, viewedUserId: targetId, viewedAt: { gte: startOfToday() } },
    select: { id: true },
  });
  if (existing) return;

  await prisma.profileView.create({ data: { viewerId, viewedUserId: targetId } });
}
