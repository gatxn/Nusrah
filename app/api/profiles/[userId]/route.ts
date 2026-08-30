import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { isEligibleTarget, serializeProfileForViewer } from "@/lib/profiles";
import { UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const viewerId = await getSessionUserId();
  if (!viewerId) return UNAUTHENTICATED();
  const { userId: targetId } = await params;

  const [tier, viewer, target, favorite] = await Promise.all([
    getEffectiveTier(viewerId),
    prisma.profile.findUnique({ where: { userId: viewerId }, select: { gender: true } }),
    prisma.profile.findUnique({
      where: { userId: targetId },
      include: { user: { select: { name: true } } },
    }),
    prisma.favorite.findUnique({
      where: { userId_favoritedUserId: { userId: viewerId, favoritedUserId: targetId } },
      select: { id: true },
    }),
  ]);

  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND();

  return NextResponse.json({
    profile: { ...serializeProfileForViewer(target, tier), isFavorited: !!favorite },
  });
}
