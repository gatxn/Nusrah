import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { jsonError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";
import { apiErrors } from "@/lib/i18n/api";

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_GALLERY_PHOTOS = 6;

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  const t = await apiErrors(request);
  if (!(file instanceof File)) return jsonError(t.noPhotoSelected, 400);
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return jsonError(t.invalidPhotoType, 400);
  if (file.size > MAX_PHOTO_BYTES) return jsonError(t.photoTooLarge, 400);

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, _count: { select: { photos: true } } },
  });
  if (!profile) return NOT_FOUND(request);
  if (profile._count.photos >= MAX_GALLERY_PHOTOS) {
    return jsonError(t.galleryLimitReached, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const photo = await prisma.profilePhoto.create({
      data: {
        profileId: profile.id,
        imageEnc: buffer,
        mimeType: file.type,
        position: profile._count.photos + 1,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: photo.id });
  } catch (error) {
    const isPositionClash = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!isPositionClash) throw error;
    return jsonError(t.photoUploadConflict, 409);
  }
}
