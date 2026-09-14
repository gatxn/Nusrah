import { prisma } from "@/lib/db";

// No Match table exists — Favorite is a one-directional like edge, so a
// "match" is computed live as a pair where both directions exist. Fine at
// this project's current real user count; revisit with a materialized
// table only if this ever becomes a real performance problem.
export type AdminMatchRow = {
  userAId: string;
  userAName: string;
  userBId: string;
  userBName: string;
  matchedAt: Date; // the later of the two Favorite timestamps — when mutuality was actually achieved
};

export async function findMutualMatches(): Promise<AdminMatchRow[]> {
  const favorites = await prisma.favorite.findMany({
    select: {
      userId: true,
      favoritedUserId: true,
      createdAt: true,
      user: { select: { name: true } },
      favoritedUser: { select: { name: true } },
    },
  });

  const byKey = new Map<string, (typeof favorites)[number]>();
  for (const f of favorites) byKey.set(`${f.userId}:${f.favoritedUserId}`, f);

  const seenPairs = new Set<string>();
  const matches: AdminMatchRow[] = [];

  for (const f of favorites) {
    const reverse = byKey.get(`${f.favoritedUserId}:${f.userId}`);
    if (!reverse) continue;

    const pairKey = [f.userId, f.favoritedUserId].sort().join(":");
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    matches.push({
      userAId: f.userId,
      userAName: f.user.name,
      userBId: f.favoritedUserId,
      userBName: f.favoritedUser.name,
      matchedAt: f.createdAt > reverse.createdAt ? f.createdAt : reverse.createdAt,
    });
  }

  return matches.sort((a, b) => b.matchedAt.getTime() - a.matchedAt.getTime());
}

export async function countMutualMatches(): Promise<number> {
  const matches = await findMutualMatches();
  return matches.length;
}

/** Matches per day over the trailing `days` days, oldest first — for the dashboard chart. */
export async function matchesPerDay(days: number): Promise<number[]> {
  const matches = await findMutualMatches();
  const buckets = new Array(days).fill(0);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const m of matches) {
    const dayIndex = Math.floor((startOfToday.getTime() - m.matchedAt.getTime()) / (24 * 60 * 60 * 1000));
    const bucket = days - 1 - dayIndex;
    if (bucket >= 0 && bucket < days) buckets[bucket]++;
  }
  return buckets;
}
