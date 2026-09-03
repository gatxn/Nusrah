import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

export async function GET(request: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);
  const { photoId } = await params;

  const photo = await prisma.profilePhoto.findUnique({
    where: { id: photoId },
    select: { imageEnc: true, mimeType: true, createdAt: true, profile: { select: { userId: true } } },
  });
  if (!photo || photo.profile.userId !== userId) return NOT_FOUND(request);

  return new NextResponse(new Uint8Array(photo.imageEnc), {
    headers: {
      "Content-Type": photo.mimeType,
      "Cache-Control": "private, max-age=3600",
      "Last-Modified": photo.createdAt.toUTCString(),
    },
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);
  const { photoId } = await params;

  const photo = await prisma.profilePhoto.findUnique({
    where: { id: photoId },
    select: { id: true, profile: { select: { userId: true } } },
  });
  if (!photo || photo.profile.userId !== userId) return NOT_FOUND(request);

  await prisma.profilePhoto.delete({ where: { id: photoId } });

  return NextResponse.json({ ok: true });
}
