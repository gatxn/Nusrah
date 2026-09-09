import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { createCall } from "@/lib/calls";
import { jsonError, zodError, UNAUTHENTICATED, NOT_FOUND, FORBIDDEN } from "@/lib/api";
import { apiErrors } from "@/lib/i18n/api";

const bodySchema = z.object({
  calleeId: z.string().min(1),
  type: z.enum(["VOICE", "VIDEO"]),
});

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodError(parsed.error);

  const tier = await getEffectiveTier(userId);
  const result = await createCall(userId, parsed.data.calleeId, parsed.data.type, tier);

  if (!result.ok) {
    const t = await apiErrors(request);
    switch (result.reason) {
      case "SELF":
        return jsonError(t.cannotMessageSelf, 400);
      case "NOT_ELIGIBLE":
        return NOT_FOUND(request);
      case "NO_CAPABILITY":
        return FORBIDDEN(
          request,
          parsed.data.type === "VIDEO" ? t.videoCallRestricted : t.voiceCallRestricted
        );
      case "ALREADY_IN_CALL":
        return jsonError(t.callAlreadyInProgress, 409);
    }
  }

  return NextResponse.json(
    { callId: result.call.id, channelName: result.call.channelName },
    { status: 201 }
  );
}
