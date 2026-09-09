import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

// Either participant can end a call at any point in its lifecycle (RINGING
// — the caller cancels before an answer — or ACCEPTED — either side hangs
// up). Idempotent: ending an already-ended call is a harmless no-op so a
// race between both sides hanging up at once can't error.
export async function POST(request: NextRequest, { params }: { params: Promise<{ callId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const { callId } = await params;
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call || (call.callerId !== userId && call.calleeId !== userId)) return NOT_FOUND(request);

  if (call.status === "RINGING" || call.status === "ACCEPTED") {
    await prisma.call.update({ where: { id: callId }, data: { status: "ENDED", endedAt: new Date() } });
  }

  return NextResponse.json({ message: "ok" });
}
