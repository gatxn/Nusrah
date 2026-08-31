import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { isEligibleTarget } from "@/lib/profiles";
import { blockCreateSchema } from "@/lib/validation";
import { jsonError, zodError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const body = await request.json().catch(() => null);
  const parsed = blockCreateSchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);
  const { blockedUserId } = parsed.data;

  if (blockedUserId === userId) {
    return jsonError("Huwezi kujizuia mwenyewe", 400);
  }

  const [viewer, target] = await Promise.all([
    prisma.profile.findUnique({ where: { userId }, select: { gender: true } }),
    prisma.profile.findUnique({ where: { userId: blockedUserId }, select: { gender: true } }),
  ]);
  if (!target || !isEligibleTarget(viewer?.gender, target.gender)) return NOT_FOUND();

  try {
    await prisma.block.create({ data: { blockerId: userId, blockedUserId } });
  } catch (error) {
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!isDuplicate) throw error;
    // Already blocked — idempotent success.
  }

  return NextResponse.json({ blocked: true });
}
