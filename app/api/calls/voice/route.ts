import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { hasCapability } from "@/lib/tiers";
import { UNAUTHENTICATED, FORBIDDEN } from "@/lib/api";
import { apiErrors } from "@/lib/i18n/api";

// Real WebRTC/telephony transport is out of scope; this route only enforces
// the tier gate from §4.4 and returns a simulated call session.
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED(request);

  const tier = await getEffectiveTier(userId);
  if (!hasCapability(tier, "canVoiceCall")) {
    const t = await apiErrors(request);
    return FORBIDDEN(request, t.voiceCallRestricted);
  }

  return NextResponse.json({
    message: "Simu ya sauti imeanzishwa (simulizi)",
    callId: `voice_${Date.now()}`,
  });
}
