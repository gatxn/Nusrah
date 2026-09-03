import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { isEligibleTarget } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; photoId: string }> }
) {
  const viewerId = await getSessionUserId();
  if (!viewerId) return UNAUTHENTICATED(request);
  const { userId: targetId, photoId } = await params;

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: viewerId }, select: { gender: true } }),
    prisma.profile.findUnique({ where: { userId: targetId }, select: { gender: true } }),
  ]);
  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND(request);
  if (await isBlocked(viewerId, targetId)) return NOT_FOUND(request);

  // Cross-check the photo actually belongs to this exact target's profile —
  // otherwise a guessed/leaked photoId from a different profile could be
  // fetched through an eligible target's userId in the URL (IDOR).
  const photo = await prisma.profilePhoto.findUnique({
    where: { id: photoId },
    select: { imageEnc: true, mimeType: true, createdAt: true, profile: { select: { userId: true } } },
  });
  if (!photo || photo.profile.userId !== targetId) return NOT_FOUND(request);

  return new NextResponse(new Uint8Array(photo.imageEnc), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=3600",
      "Last-Modified": photo.createdAt.toUTCString(),
    },
  });
}
