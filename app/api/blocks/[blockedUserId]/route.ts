import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED } from "@/lib/api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ blockedUserId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();
  const { blockedUserId } = await params;

  try {
    await prisma.block.delete({
      where: { blockerId_blockedUserId: { blockerId: userId, blockedUserId } },
    });
  } catch (error) {
    const isMissing =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
    if (!isMissing) throw error;
    // Already not blocked — idempotent success.
  }

  return NextResponse.json({ blocked: false });
}
