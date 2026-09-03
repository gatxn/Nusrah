import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { isEligibleTarget } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const viewerId = await getSessionUserId();
  if (!viewerId) return UNAUTHENTICATED(request);
  const { userId: targetId } = await params;

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: viewerId }, select: { gender: true } }),
    prisma.profile.findUnique({
      where: { userId: targetId },
      select: { gender: true, photos: { orderBy: { position: "asc" }, select: { id: true, position: true } } },
    }),
  ]);

  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND(request);
  if (await isBlocked(viewerId, targetId)) return NOT_FOUND(request);

  return NextResponse.json({ photos: target.photos });
}
