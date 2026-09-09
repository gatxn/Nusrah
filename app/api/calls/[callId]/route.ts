import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getCallForParticipant } from "@/lib/calls";
import { UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";

// Polled by the CALLER while a call is RINGING, to detect the callee's
// ACCEPTED/DECLINED response (or the ring timing out into MISSED).
export async function GET(request: NextRequest, { params }: { params: Promise<{ callId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const { callId } = await params;
  const call = await getCallForParticipant(callId, userId);
  if (!call) return NOT_FOUND(request);

  return NextResponse.json({ call });
}
