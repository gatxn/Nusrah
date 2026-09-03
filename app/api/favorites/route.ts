import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget, queryMembers } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { maybeNotifyProfileLiked } from "@/lib/notifications";
import { createFavoriteSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";
import { validationMessages, apiErrors } from "@/lib/i18n/api";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

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
    page: 1,
    favoritedOnly: true,
    viewerFavoriteIds,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const v = await validationMessages(request);
  const parsed = createFavoriteSchema(v).safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const { favoritedUserId } = parsed.data;

  if (favoritedUserId === userId) {
    const t = await apiErrors(request);
    return jsonError(t.cannotFavoriteSelf, 400);
  }

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { gender: true } }),
    prisma.profile.findUnique({ where: { userId: favoritedUserId }, select: { gender: true } }),
  ]);
  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND(request);
  if (await isBlocked(userId, favoritedUserId)) return NOT_FOUND(request);

  try {
    await prisma.favorite.create({ data: { userId, favoritedUserId } });
    await maybeNotifyProfileLiked(favoritedUserId, userId);
  } catch (error) {
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!isDuplicate) throw error;
    // Already favorited — idempotent success, no duplicate notification.
  }

  return NextResponse.json({ favorited: true });
}
