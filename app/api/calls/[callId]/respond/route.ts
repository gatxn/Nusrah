import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { jsonError, zodError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";
import { apiErrors } from "@/lib/i18n/api";

const bodySchema = z.object({ action: z.enum(["ACCEPT", "DECLINE"]) });

// Only the callee may respond, and only while the call is still RINGING —
// mirrors the same ownership + state-check shape as respond-style routes
// elsewhere in this app (e.g. reset-password's token check).
export async function POST(request: NextRequest, { params }: { params: Promise<{ callId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const { callId } = await params;
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call || call.calleeId !== userId) return NOT_FOUND(request);

  if (call.status !== "RINGING") {
    const t = await apiErrors(request);
    return jsonError(t.callAlreadyInProgress, 409);
  }

  const updated = await prisma.call.update({
    where: { id: callId },
    data: {
      status: parsed.data.action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
      respondedAt: new Date(),
    },
  });

  return NextResponse.json({ call: updated });
}
