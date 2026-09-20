import type { Prisma, Profile } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import { isTier, meetsMinimumTier, hasCapability, type Tier } from "@/lib/tiers";
import { getAge } from "@/lib/dates";
import { MEMBERS_PAGE_SIZE, NEW_PROFILE_WINDOW_DAYS, isIntention, type Intention } from "@/lib/onboarding";
import { getBlockedUserIds } from "@/lib/blocks";
import type { MemberSortMode } from "@/lib/validation";

// Flat, demo-scale pagination safety cap on the browse list — unrelated to
// any tier's profileViewLimit, which is enforced separately when a profile
// is actually opened (see lib/profile-views.ts).
const ABSOLUTE_MAX = 100;

// A profile counts as "online" while lastActiveAt is within this window.
// Deliberately just a boolean signal, never a displayed timestamp — see
// touchLastActive below.
export const ONLINE_WINDOW_MINUTES = 5;

function isRecentlyActive(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - lastActiveAt.getTime() < ONLINE_WINDOW_MINUTES * 60 * 1000;
}

// Throttle for the write side: touched at most once per this many minutes
// per user, so ordinary browsing doesn't issue a write on every page load.
const ACTIVITY_WRITE_THROTTLE_MINUTES = 2;

/**
 * Called from (app)/layout.tsx on every authenticated page load. A single
 * conditional UPDATE — cheap no-op on most calls since it only writes when
 * the caller's own lastActiveAt is missing or stale. The raw timestamp this
 * writes is never read back out to any client; only the derived `isOnline`
 * boolean (see serializeProfileForViewer) ever leaves this file.
 */
export async function touchLastActive(userId: string): Promise<void> {
  const staleBefore = new Date(Date.now() - ACTIVITY_WRITE_THROTTLE_MINUTES * 60 * 1000);
  await prisma.profile.updateMany({
    where: { userId, OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: staleBefore } }] },
    data: { lastActiveAt: new Date() },
  });
}

export function calculateAge(dob: Date | null): number | null {
  return dob ? getAge(dob) : null;
}

/**
 * The ONE place the gender-visibility rule lives (§2 of the build spec):
 * a signed-in user only ever sees opposite-gender members. Every endpoint
 * that lists, fetches, or serves a photo for another member must call this
 * instead of re-deriving the rule.
 */
export function isEligibleTarget(
  viewerGender: string | null | undefined,
  targetGender: string | null | undefined
): boolean {
  return !!viewerGender && !!targetGender && viewerGender !== targetGender;
}

export type SerializedProfile = {
  userId: string;
  name: string;
  gender: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  intentions: Intention[];
  age: number | null;
  bio: string | null;
  hasPhoto: boolean;
  contactVisible: boolean;
  phone: string | null;
  location: string | null;
  isFavorited: boolean;
  educationLevel: string | null;
  occupation: string | null;
  madhhab: string | null;
  wearsHijab: string | null;
  maritalStatus: string | null;
  isNew: boolean;
  isVerified: boolean;
  isOnline: boolean;
  prayerHabit: string | null;
  quranLevel: string | null;
  substanceUse: string | null;
  height: number | null;
  bodyType: string | null;
  skinTone: string | null;
  incomeRange: string | null;
  partnerAgeMin: number | null;
  partnerAgeMax: number | null;
};

type ProfileForSerialization = Pick<
  Profile,
  | "userId"
  | "gender"
  | "dob"
  | "city"
  | "region"
  | "country"
  | "intentions"
  | "bio"
  | "phoneEnc"
  | "locationEnc"
  | "showContactToTier"
  | "photoUpdatedAt"
  | "educationLevel"
  | "occupation"
  | "madhhab"
  | "wearsHijab"
  | "maritalStatus"
  | "createdAt"
  | "verificationStatus"
  | "lastActiveAt"
  | "prayerHabit"
  | "quranLevel"
  | "substanceUse"
  | "height"
  | "bodyType"
  | "skinTone"
  | "incomeRange"
  | "partnerAgeMin"
  | "partnerAgeMax"
> & { user: { name: string } };

/**
 * Redacts sensitive fields unless BOTH the viewer's tier and the profile
 * owner's own privacy setting (showContactToTier) allow it — per §4.4.
 * `isFavorited` defaults to false; callers that know the viewer's favorite
 * set should overlay it (queryMembers below does this automatically).
 */
export function serializeProfileForViewer(
  profile: ProfileForSerialization,
  viewerTier: Tier
): SerializedProfile {
  const requiredTier = isTier(profile.showContactToTier) ? profile.showContactToTier : "GOLD";
  const contactVisible = meetsMinimumTier(viewerTier, requiredTier);

  const ageMs = Date.now() - profile.createdAt.getTime();
  const isVerified = profile.verificationStatus === "VERIFIED";

  return {
    userId: profile.userId,
    name: profile.user.name,
    gender: profile.gender,
    city: profile.city,
    region: profile.region,
    country: profile.country,
    intentions: profile.intentions.filter(isIntention),
    age: calculateAge(profile.dob),
    bio: profile.bio,
    hasPhoto: !!profile.photoUpdatedAt,
    contactVisible,
    phone: contactVisible && profile.phoneEnc ? decryptField(profile.phoneEnc) : null,
    location: contactVisible && profile.locationEnc ? decryptField(profile.locationEnc) : null,
    isFavorited: false,
    educationLevel: profile.educationLevel,
    occupation: profile.occupation,
    madhhab: profile.madhhab,
    wearsHijab: profile.wearsHijab,
    maritalStatus: profile.maritalStatus,
    isNew: ageMs < NEW_PROFILE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    isVerified,
    isOnline: isRecentlyActive(profile.lastActiveAt),
    prayerHabit: profile.prayerHabit,
    quranLevel: profile.quranLevel,
    substanceUse: profile.substanceUse,
    height: profile.height,
    bodyType: profile.bodyType,
    skinTone: profile.skinTone,
    incomeRange: profile.incomeRange,
    partnerAgeMin: profile.partnerAgeMin,
    partnerAgeMax: profile.partnerAgeMax,
  };
}

/** Converts an inclusive [minAge, maxAge] range into a `dob` range filter. */
export function ageRangeToDobFilter(minAge?: number, maxAge?: number): { lte?: Date; gt?: Date } {
  const now = new Date();
  const filter: { lte?: Date; gt?: Date } = {};
  if (minAge !== undefined) {
    filter.lte = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate());
  }
  if (maxAge !== undefined) {
    filter.gt = new Date(now.getFullYear() - maxAge - 1, now.getMonth(), now.getDate());
  }
  return filter;
}

export type MembersQueryParams = {
  viewerId: string;
  viewerGender: string | null;
  tier: Tier;
  page: number;
  minAge?: number;
  maxAge?: number;
  regions?: string[];
  maritalStatuses?: string[];
  madhhabs?: string[];
  hijab?: string[];
  intentions?: string[];
  search?: string;
  favoritedOnly?: boolean;
  verifiedOnly?: boolean;
  viewerFavoriteIds?: Set<string>;
  sort?: MemberSortMode;
};

// Shared row shape for every member-listing surface (browse, favorites,
// Likes You) — one definition so a field added for one never silently
// drifts out of sync with the others.
const PROFILE_LIST_SELECT = {
  userId: true,
  gender: true,
  dob: true,
  city: true,
  region: true,
  country: true,
  bio: true,
  intentions: true,
  phoneEnc: true,
  locationEnc: true,
  showContactToTier: true,
  photoUpdatedAt: true,
  educationLevel: true,
  occupation: true,
  madhhab: true,
  wearsHijab: true,
  maritalStatus: true,
  createdAt: true,
  verificationStatus: true,
  lastActiveAt: true,
  prayerHabit: true,
  quranLevel: true,
  substanceUse: true,
  height: true,
  bodyType: true,
  skinTone: true,
  incomeRange: true,
  partnerAgeMin: true,
  partnerAgeMax: true,
  user: { select: { name: true } },
} satisfies Prisma.ProfileSelect;

// v1 "Best Match" heuristic — a small, explainable weighted score, not
// machine learning: rewards having a photo, intentions shared with the
// viewer, verification, currently being online, and (mildly, decaying over
// ~5 weeks) newer profiles. Computed in application code because Postgres
// can't ORDER BY a value that doesn't exist as a column.
function scoreForBestMatch(
  p: {
    photoUpdatedAt: Date | null;
    intentions: string[];
    createdAt: Date;
    verificationStatus: string;
    lastActiveAt: Date | null;
  },
  viewerIntentions: Intention[]
): number {
  let score = 0;
  if (p.photoUpdatedAt) score += 3;
  const shared = p.intentions.filter((i) => (viewerIntentions as string[]).includes(i)).length;
  score += shared * 2;
  const ageDays = (Date.now() - p.createdAt.getTime()) / (24 * 60 * 60 * 1000);
  score += Math.max(0, 5 - ageDays / 7);
  if (p.verificationStatus === "VERIFIED") score += 2;
  if (isRecentlyActive(p.lastActiveAt)) score += 1;
  return score;
}

export type MembersQueryResult = {
  profiles: SerializedProfile[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * Shared query builder used by both the SSR first page (app/(main)/wanachama)
 * and every later client-fetched page (app/api/profiles/route.ts), so
 * filtering/pagination/tier-cap logic never drifts between the two.
 */
export async function queryMembers(params: MembersQueryParams): Promise<MembersQueryResult> {
  const {
    viewerId,
    viewerGender,
    tier,
    page,
    minAge,
    maxAge,
    regions = [],
    maritalStatuses = [],
    madhhabs = [],
    hijab = [],
    intentions: intentionsFilter = [],
    search,
    favoritedOnly = false,
    verifiedOnly = false,
    viewerFavoriteIds = new Set<string>(),
    sort = "recent",
  } = params;

  // The browse list itself shows the full matching pool regardless of
  // tier — profileViewLimit is enforced where a profile is actually
  // opened (see lib/profile-views.ts), not by hiding list results. This
  // is just a flat, demo-scale pagination safety cap.
  const remaining = ABSOLUTE_MAX - (page - 1) * MEMBERS_PAGE_SIZE;
  if (remaining <= 0) {
    return { profiles: [], page, pageSize: MEMBERS_PAGE_SIZE, hasMore: false };
  }
  const take = Math.min(MEMBERS_PAGE_SIZE, remaining);
  const skip = (page - 1) * MEMBERS_PAGE_SIZE;

  const blockedIds = await getBlockedUserIds(viewerId);

  const where: Prisma.ProfileWhereInput = {
    ...(favoritedOnly
      ? { userId: { in: Array.from(viewerFavoriteIds), notIn: blockedIds } }
      : { userId: { not: viewerId, notIn: blockedIds } }),
    ...(viewerGender ? { gender: { not: viewerGender } } : {}),
    dob: { not: null, ...ageRangeToDobFilter(minAge, maxAge) },
    region: { not: null, ...(regions.length ? { in: regions } : {}) },
    intentions: intentionsFilter.length ? { hasSome: intentionsFilter } : { isEmpty: false },
    ...(maritalStatuses.length ? { maritalStatus: { in: maritalStatuses } } : {}),
    ...(madhhabs.length ? { madhhab: { in: madhhabs } } : {}),
    ...(hijab.length ? { wearsHijab: { in: hijab } } : {}),
    ...(verifiedOnly ? { verificationStatus: "VERIFIED" } : {}),
    ...(search
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { bio: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { occupation: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const select = PROFILE_LIST_SELECT;

  let profiles: Prisma.ProfileGetPayload<{ select: typeof select }>[];
  let hasMore: boolean;

  if (sort === "best_match") {
    // Ranking-by-score can't be expressed as a Postgres ORDER BY, so the
    // whole tier-capped eligible set is fetched once, scored and sorted in
    // application code, then sliced per-page — same "demo-scale in-memory
    // reduction" precedent as this file's ABSOLUTE_MAX cap and
    // lib/messages.ts's CONVERSATION_SCAN_CAP.
    const viewerProfile = await prisma.profile.findUnique({
      where: { userId: viewerId },
      select: { intentions: true },
    });
    const viewerIntentions = (viewerProfile?.intentions ?? []).filter(isIntention);

    const allEligible = await prisma.profile.findMany({
      where,
      select,
      orderBy: { createdAt: "desc" },
      take: ABSOLUTE_MAX,
    });
    const sorted = [...allEligible].sort(
      (a, b) => scoreForBestMatch(b, viewerIntentions) - scoreForBestMatch(a, viewerIntentions)
    );
    profiles = sorted.slice(skip, skip + take);
    hasMore = skip + profiles.length < sorted.length && profiles.length === take;
  } else {
    profiles = await prisma.profile.findMany({
      where,
      select,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
    hasMore = skip + profiles.length < remaining && profiles.length === take;
  }

  return {
    profiles: profiles.map((p) => ({
      ...serializeProfileForViewer(p, tier),
      isFavorited: viewerFavoriteIds.has(p.userId),
    })),
    page,
    pageSize: MEMBERS_PAGE_SIZE,
    hasMore,
  };
}

export type LikedYouResult =
  | { gated: true; count: number }
  | { gated: false; profiles: SerializedProfile[] };

/**
 * Reverse-direction Favorite lookup ("who liked me") for the Likes You page.
 * Reuses the exact SILVER+ `canSeeWhoLikedYou` gate already enforced for the
 * notification bell (see toNotificationView in lib/notifications.ts) rather
 * than inventing a second gating rule — below that tier, only a count is
 * returned so the UI can show the same "X people liked you, upgrade to see
 * who" teaser copy already used there.
 */
export async function queryLikedYouProfiles(viewerId: string, tier: Tier): Promise<LikedYouResult> {
  const [likerRows, blockedIds] = await Promise.all([
    prisma.favorite.findMany({
      where: { favoritedUserId: viewerId },
      select: { userId: true },
      orderBy: { createdAt: "desc" },
    }),
    getBlockedUserIds(viewerId),
  ]);
  const blocked = new Set(blockedIds);
  const likerIds = likerRows.map((r) => r.userId).filter((id) => !blocked.has(id));

  if (!hasCapability(tier, "canSeeWhoLikedYou")) {
    return { gated: true, count: likerIds.length };
  }
  if (likerIds.length === 0) {
    return { gated: false, profiles: [] };
  }

  const [rows, viewerFavoriteRows] = await Promise.all([
    prisma.profile.findMany({
      where: { userId: { in: likerIds } },
      select: PROFILE_LIST_SELECT,
    }),
    prisma.favorite.findMany({
      where: { userId: viewerId, favoritedUserId: { in: likerIds } },
      select: { favoritedUserId: true },
    }),
  ]);
  const viewerFavoriteIds = new Set(viewerFavoriteRows.map((f) => f.favoritedUserId));

  // Preserve "most recently liked you first" order from the initial scan.
  const order = new Map(likerIds.map((id, i) => [id, i]));
  const sorted = [...rows].sort((a, b) => (order.get(a.userId) ?? 0) - (order.get(b.userId) ?? 0));

  return {
    gated: false,
    profiles: sorted.map((p) => ({
      ...serializeProfileForViewer(p, tier),
      isFavorited: viewerFavoriteIds.has(p.userId),
    })),
  };
}
