import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { TIER_CAPABILITIES } from "@/lib/tiers";
import { queryMembers } from "@/lib/profiles";
import { createMemberQuerySchema } from "@/lib/validation";
import { zodError, UNAUTHENTICATED } from "@/lib/api";
import { validationMessages } from "@/lib/i18n/api";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const v = await validationMessages(request);
  const parsed = createMemberQuerySchema(v).safeParse(
    Object.fromEntries(request.nextUrl.searchParams)
  );
  if (!parsed.success) return zodError(parsed.error);
  const {
    minAge,
    maxAge,
    regions,
    maritalStatuses,
    madhhabs,
    hijab,
    intentions,
    search,
    page,
    favoritesOnly,
    verifiedOnly,
    sort,
  } = parsed.data;

  const [tier, viewer, favoriteRows] = await Promise.all([
    getEffectiveTier(userId),
    prisma.profile.findUnique({ where: { userId }, select: { gender: true } }),
    prisma.favorite.findMany({ where: { userId }, select: { favoritedUserId: true } }),
  ]);

  const viewerFavoriteIds = new Set(favoriteRows.map((f) => f.favoritedUserId));

  const result = await queryMembers({
    viewerId: userId,
    viewerGender: viewer?.gender ?? null,
    tier,
    page,
    minAge,
    maxAge,
    regions,
    maritalStatuses,
    madhhabs,
    hijab,
    intentions,
    search,
    favoritedOnly: favoritesOnly,
    verifiedOnly,
    viewerFavoriteIds,
    sort,
  });

  return NextResponse.json({
    tier,
    viewLimit: Number.isFinite(TIER_CAPABILITIES[tier].profileViewLimit)
      ? TIER_CAPABILITIES[tier].profileViewLimit
      : null,
    ...result,
  });
}
