import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { jsonError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

// No SVG: this route echoes back the stored MIME type as the response's
// Content-Type, so an SVG upload would be a stored-XSS vector.
const ALLOWED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const form = await request.formData().catch(() => null);
  const file = form?.get("idDocument");
  if (!(file instanceof File)) return jsonError("Chagua faili", 400);
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) return jsonError("Aina ya faili si sahihi", 400);
  if (file.size > MAX_DOCUMENT_BYTES) return jsonError("Faili ni kubwa mno", 400);

  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.profile.update({
    where: { userId },
    data: { idDocumentEnc: buffer, idDocumentMimeType: file.type, idDocumentUpdatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { idDocumentEnc: true, idDocumentMimeType: true, idDocumentUpdatedAt: true },
  });
  if (!profile?.idDocumentEnc) return NOT_FOUND();

  return new NextResponse(new Uint8Array(profile.idDocumentEnc), {
    headers: {
      "Content-Type": profile.idDocumentMimeType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
      ...(profile.idDocumentUpdatedAt ? { "Last-Modified": profile.idDocumentUpdatedAt.toUTCString() } : {}),
    },
  });
}

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  await prisma.profile.update({
    where: { userId },
    data: { idDocumentEnc: null, idDocumentMimeType: null, idDocumentUpdatedAt: null },
  });

  return NextResponse.json({ ok: true });
}
