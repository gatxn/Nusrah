import { prisma } from "@/lib/db";
import { isEligibleTarget } from "@/lib/profiles";
import { isBlocked } from "@/lib/blocks";
import { hasCapability, type Tier } from "@/lib/tiers";

export type CallType = "VOICE" | "VIDEO";
export type CallStatus = "RINGING" | "ACCEPTED" | "DECLINED" | "ENDED" | "MISSED";

// How long an unanswered call keeps ringing before it's treated as missed.
// Enforced lazily (checked wherever a RINGING call is read) rather than by a
// background job — there's no cron/queue infra in this app, matching the
// same "opportunistic on read" pattern touchLastActive already uses.
const RING_TIMEOUT_SECONDS = 45;

function isStale(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > RING_TIMEOUT_SECONDS * 1000;
}

export type IncomingCallView = {
  id: string;
  type: CallType;
  channelName: string;
  callerId: string;
  callerName: string;
  callerHasPhoto: boolean;
};

/** Called by the client's incoming-call poll. Auto-expires a stale ring. */
export async function getIncomingCall(userId: string): Promise<IncomingCallView | null> {
  const call = await prisma.call.findFirst({
    where: { calleeId: userId, status: "RINGING" },
    orderBy: { createdAt: "desc" },
    include: { caller: { select: { name: true, profile: { select: { photoUpdatedAt: true } } } } },
  });
  if (!call) return null;

  if (isStale(call.createdAt)) {
    await prisma.call.update({ where: { id: call.id }, data: { status: "MISSED" } });
    return null;
  }

  return {
    id: call.id,
    type: call.type as CallType,
    channelName: call.channelName,
    callerId: call.callerId,
    callerName: call.caller.name,
    callerHasPhoto: !!call.caller.profile?.photoUpdatedAt,
  };
}

export type CallRecord = {
  id: string;
  callerId: string;
  calleeId: string;
  type: CallType;
  channelName: string;
  status: CallStatus;
};

/** Ownership-checked read, used by the caller's "waiting for answer" poll. */
export async function getCallForParticipant(callId: string, userId: string): Promise<CallRecord | null> {
  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call || (call.callerId !== userId && call.calleeId !== userId)) return null;

  if (call.status === "RINGING" && isStale(call.createdAt)) {
    const updated = await prisma.call.update({ where: { id: call.id }, data: { status: "MISSED" } });
    return { ...updated, type: updated.type as CallType, status: updated.status as CallStatus };
  }

  return { ...call, type: call.type as CallType, status: call.status as CallStatus };
}

export type CreateCallResult =
  | { ok: true; call: CallRecord }
  | { ok: false; reason: "SELF" | "NOT_ELIGIBLE" | "NO_CAPABILITY" | "ALREADY_IN_CALL" };

/**
 * Single source of truth for "can X call Y right now" — mirrors the
 * gender-visibility + block checks every other cross-member endpoint already
 * enforces (see isEligibleTarget/isBlocked), plus a tier capability check and
 * a simple "not already mid-call" guard so a caller/callee can't be rung
 * twice at once.
 */
export async function createCall(
  callerId: string,
  calleeId: string,
  type: CallType,
  callerTier: Tier
): Promise<CreateCallResult> {
  if (callerId === calleeId) return { ok: false, reason: "SELF" };

  const capability = type === "VIDEO" ? "canVideoCall" : "canVoiceCall";
  if (!hasCapability(callerTier, capability)) return { ok: false, reason: "NO_CAPABILITY" };

  const [callerProfile, calleeProfile, blocked] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: callerId }, select: { gender: true } }),
    prisma.profile.findUnique({ where: { userId: calleeId }, select: { gender: true } }),
    isBlocked(callerId, calleeId),
  ]);
  if (!calleeProfile || !isEligibleTarget(callerProfile?.gender, calleeProfile.gender) || blocked) {
    return { ok: false, reason: "NOT_ELIGIBLE" };
  }

  const existing = await prisma.call.findFirst({
    where: {
      status: { in: ["RINGING", "ACCEPTED"] },
      OR: [{ callerId }, { calleeId: callerId }, { callerId: calleeId }, { calleeId }],
    },
  });
  if (existing && !(existing.status === "RINGING" && isStale(existing.createdAt))) {
    return { ok: false, reason: "ALREADY_IN_CALL" };
  }

  const call = await prisma.call.create({
    data: {
      callerId,
      calleeId,
      type,
      channelName: `call_${callerId.slice(-6)}${calleeId.slice(-6)}${Date.now()}`,
    },
  });
  return { ok: true, call: { ...call, type: call.type as CallType, status: call.status as CallStatus } };
}
