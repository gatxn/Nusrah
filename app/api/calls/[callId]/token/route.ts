import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { buildRtcToken, getAgoraAppId, isAgoraConfigured } from "@/lib/agora";
import { jsonError, UNAUTHENTICATED, NOT_FOUND } from "@/lib/api";
import { apiErrors } from "@/lib/i18n/api";

// Only issued once both sides have agreed the call is happening (ACCEPTED)
// — never for a merely RINGING call, so a token can't be minted before the
// callee has actually consented. uid only needs to be unique within this
// one call's own channel, so caller/callee are simply 1/2, not a hash of
// their real user id.
export async function GET(request: NextRequest, { params }: { params: Promise<{ callId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  if (!isAgoraConfigured()) {
    const t = await apiErrors(request);
    return jsonError(t.callServiceNotConfigured, 503);
  }

  const { callId } = await params;
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call || (call.callerId !== userId && call.calleeId !== userId)) return NOT_FOUND(request);
  if (call.status !== "ACCEPTED") return NOT_FOUND(request);

  const uid = call.callerId === userId ? 1 : 2;
  const token = buildRtcToken(call.channelName, uid);

  return NextResponse.json({
    appId: getAgoraAppId(),
    channelName: call.channelName,
    token,
    uid,
    withVideo: call.type === "VIDEO",
  });
}
