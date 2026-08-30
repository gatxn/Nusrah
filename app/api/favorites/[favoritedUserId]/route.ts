import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED } from "@/lib/api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ favoritedUserId: string }> }
) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();
  const { favoritedUserId } = await params;

  try {
    // Only the Favorite row is removed — never touches any Notification row,
    // so un-favoriting doesn't notify and doesn't retract an earlier "liked
    // you" alert.
    await prisma.favorite.delete({
      where: { userId_favoritedUserId: { userId, favoritedUserId } },
    });
  } catch (error) {
    const isMissing =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
    if (!isMissing) throw error;
    // Already not favorited — idempotent success.
  }

  return NextResponse.json({ favorited: false });
}
