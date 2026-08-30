import { NextResponse } from "next/server";
import { getSessionUserId, getEffectiveTier } from "@/lib/auth";
import { hasCapability } from "@/lib/tiers";
import { UNAUTHENTICATED, FORBIDDEN } from "@/lib/api";

// Real WebRTC/telephony transport is out of scope; this route only enforces
// the tier gate from §4.4 and returns a simulated call session.
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return UNAUTHENTICATED();

  const tier = await getEffectiveTier(userId);
  if (!hasCapability(tier, "canVoiceCall")) {
    return FORBIDDEN("Simu za sauti zinapatikana kwa wanachama wa GOLD na PREMIUM pekee.");
  }

  return NextResponse.json({
    message: "Simu ya sauti imeanzishwa (simulizi)",
    callId: `voice_${Date.now()}`,
  });
}
