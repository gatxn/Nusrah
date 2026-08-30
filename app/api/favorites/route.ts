import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget, queryMembers } from "@/lib/profiles";
import { maybeNotifyProfileLiked } from "@/lib/notifications";
import { favoriteCreateSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

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
  if (!userId) return UNAUTHENTICATED();

  const body = await request.json().catch(() => null);
  const parsed = favoriteCreateSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const { favoritedUserId } = parsed.data;

  if (favoritedUserId === userId) {
    return jsonError("Huwezi kujipenda mwenyewe", 400);
  }

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { gender: true } }),
    prisma.profile.findUnique({ where: { userId: favoritedUserId }, select: { gender: true } }),
  ]);
  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND();

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
