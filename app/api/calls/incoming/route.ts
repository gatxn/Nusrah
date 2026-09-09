import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { getIncomingCall } from "@/lib/calls";
import { UNAUTHENTICATED } from "@/lib/api";

// Polled app-wide (see components/calls/CallProvider.tsx) so an incoming
// call can be answered from anywhere in the app, not just one page — same
// "no WebSocket infra, so poll" precedent as ThreadView's message polling.
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const call = await getIncomingCall(userId);
  return NextResponse.json({ call });
}
