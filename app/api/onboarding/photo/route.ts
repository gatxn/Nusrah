import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { jsonError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

// No SVG: this route echoes back the stored MIME type as the response's
// Content-Type, so an SVG upload would be a stored-XSS vector.
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File)) return jsonError("Chagua picha", 400);
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return jsonError("Aina ya picha si sahihi", 400);
  if (file.size > MAX_PHOTO_BYTES) return jsonError("Picha ni kubwa mno", 400);

  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.profile.update({
    where: { userId },
    data: { photoEnc: buffer, photoMimeType: file.type, photoUpdatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { photoEnc: true, photoMimeType: true, photoUpdatedAt: true },
  });
  if (!profile?.photoEnc) return NOT_FOUND();

  return new NextResponse(new Uint8Array(profile.photoEnc), {
    headers: {
      "Content-Type": profile.photoMimeType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
      ...(profile.photoUpdatedAt ? { "Last-Modified": profile.photoUpdatedAt.toUTCString() } : {}),
    },
  });
}

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  await prisma.profile.update({
    where: { userId },
    data: { photoEnc: null, photoMimeType: null, photoUpdatedAt: null },
  });

  return NextResponse.json({ ok: true });
}
