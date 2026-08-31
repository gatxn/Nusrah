import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { isEligibleTarget } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const viewerId = await getSessionUserId();
  if (!viewerId) return UNAUTHENTICATED();
  const { userId: targetId } = await params;

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: viewerId }, select: { gender: true } }),
    prisma.profile.findUnique({
      where: { userId: targetId },
      select: { gender: true, photoEnc: true, photoMimeType: true, photoUpdatedAt: true },
    }),
  ]);

  if (!target?.photoEnc || !isEligibleTarget(viewer?.gender, target.gender)) {
    return NOT_FOUND();
  }
  if (await isBlocked(viewerId, targetId)) return NOT_FOUND();

  return new NextResponse(new Uint8Array(target.photoEnc), {
    headers: {
      "Content-Type": target.photoMimeType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
      ...(target.photoUpdatedAt ? { "Last-Modified": target.photoUpdatedAt.toUTCString() } : {}),
    },
  });
}
