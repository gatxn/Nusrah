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
  if (!hasCapability(tier, "canVideoCall")) {
    return FORBIDDEN("Simu za video zinapatikana kwa wanachama wa PREMIUM pekee.");
  }

  return NextResponse.json({
    message: "Simu ya video imeanzishwa (simulizi)",
    callId: `video_${Date.now()}`,
  });
}
