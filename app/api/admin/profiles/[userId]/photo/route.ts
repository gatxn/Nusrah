import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// Deliberately separate from app/api/profiles/[userId]/photo/route.ts,
// which requires opposite-gender eligibility — an admin account has no
// Profile at all, so that check would always fail here.
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { userId } = await params;
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { photoEnc: true, photoMimeType: true, photoUpdatedAt: true },
  });
  if (!profile?.photoEnc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(profile.photoEnc), {
    headers: {
      "Content-Type": profile.photoMimeType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
      ...(profile.photoUpdatedAt ? { "Last-Modified": profile.photoUpdatedAt.toUTCString() } : {}),
    },
  });
}
