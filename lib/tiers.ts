// Central tier capability matrix. Every protected API route must resolve the
// caller's LIVE subscription (see getActiveSubscription in lib/auth.ts) and
// check it against this matrix here — never trust a client-supplied tier or
// a stale value cached in the JWT.

export const TIERS = ["FREE", "BASIC", "SILVER", "GOLD", "PREMIUM"] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_RANK: Record<Tier, number> = {
  FREE: 0,
  BASIC: 1,
  SILVER: 2,
  GOLD: 3,
  PREMIUM: 4,
};

export type TierCapabilities = {
  profileViewLimit: number; // per day; Infinity for unlimited
  canInitiateMessage: boolean;
  canReplyToMessage: boolean;
  canVoiceCall: boolean;
  canVideoCall: boolean;
  prioritySupport: boolean;
  vipBadge: boolean;
  canSeeWhoLikedYou: boolean;
};

export const TIER_CAPABILITIES: Record<Tier, TierCapabilities> = {
  FREE: {
    profileViewLimit: 5,
    canInitiateMessage: false,
    canReplyToMessage: false,
    canVoiceCall: false,
    canVideoCall: false,
    prioritySupport: false,
    vipBadge: false,
    canSeeWhoLikedYou: false,
  },
  BASIC: {
    profileViewLimit: 20,
    canInitiateMessage: false,
    canReplyToMessage: true,
    canVoiceCall: false,
    canVideoCall: false,
    prioritySupport: false,
    vipBadge: false,
    canSeeWhoLikedYou: false,
  },
  SILVER: {
    profileViewLimit: 60,
    canInitiateMessage: true,
    canReplyToMessage: true,
    canVoiceCall: false,
    canVideoCall: false,
    prioritySupport: false,
    vipBadge: false,
    canSeeWhoLikedYou: true,
  },
  GOLD: {
    profileViewLimit: Infinity,
    canInitiateMessage: true,
    canReplyToMessage: true,
    canVoiceCall: true,
    canVideoCall: false,
    prioritySupport: true,
    vipBadge: false,
    canSeeWhoLikedYou: true,
  },
  PREMIUM: {
    profileViewLimit: Infinity,
    canInitiateMessage: true,
    canReplyToMessage: true,
    canVoiceCall: true,
    canVideoCall: true,
    prioritySupport: true,
    vipBadge: true,
    canSeeWhoLikedYou: true,
  },
};

export function isTier(value: string): value is Tier {
  return (TIERS as readonly string[]).includes(value);
}

/** A subscription is only live/usable if ACTIVE and not past its expiry. */
export function isSubscriptionLive(sub: {
  status: string;
  expiryDate: Date | string;
} | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status !== "ACTIVE") return false;
  return new Date(sub.expiryDate).getTime() > Date.now();
}

/**
 * Resolve the effective tier for access-control purposes: FREE unless the
 * caller has a live (ACTIVE, unexpired) subscription to something higher.
 */
export function effectiveTier(
  sub: { status: string; expiryDate: Date | string; tier: string } | null | undefined
): Tier {
  if (!sub || !isSubscriptionLive(sub)) return "FREE";
  return isTier(sub.tier) ? sub.tier : "FREE";
}

export function hasCapability<K extends keyof TierCapabilities>(
  tier: Tier,
  capability: K
): TierCapabilities[K] {
  return TIER_CAPABILITIES[tier][capability];
}

/** Minimum-tier check, e.g. "does this viewer's tier meet-or-exceed X". */
export function meetsMinimumTier(tier: Tier, minimum: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[minimum];
}
