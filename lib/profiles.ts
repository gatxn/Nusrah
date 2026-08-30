import type { Prisma, Profile } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decryptField } from "@/lib/crypto";
import { isTier, meetsMinimumTier, type Tier } from "@/lib/tiers";
import { TIER_CAPABILITIES } from "@/lib/tiers";
import { getAge } from "@/lib/dates";
import { MEMBERS_PAGE_SIZE, isIntention, type Intention } from "@/lib/onboarding";

// Demo-scale hard cap even for tiers with an "unlimited" profileViewLimit.
const ABSOLUTE_MAX = 100;

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
  search?: string;
  favoritedOnly?: boolean;
  viewerFavoriteIds?: Set<string>;
};

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
    search,
    favoritedOnly = false,
    viewerFavoriteIds = new Set<string>(),
  } = params;

  const limit = Math.min(TIER_CAPABILITIES[tier].profileViewLimit, ABSOLUTE_MAX);
  const remaining = limit - (page - 1) * MEMBERS_PAGE_SIZE;
  if (remaining <= 0) {
    return { profiles: [], page, pageSize: MEMBERS_PAGE_SIZE, hasMore: false };
  }
  const take = Math.min(MEMBERS_PAGE_SIZE, remaining);
  const skip = (page - 1) * MEMBERS_PAGE_SIZE;

  const where: Prisma.ProfileWhereInput = {
    ...(favoritedOnly
      ? { userId: { in: Array.from(viewerFavoriteIds) } }
      : { userId: { not: viewerId } }),
    ...(viewerGender ? { gender: { not: viewerGender } } : {}),
    dob: { not: null, ...ageRangeToDobFilter(minAge, maxAge) },
    region: { not: null, ...(regions.length ? { in: regions } : {}) },
    intentions: { isEmpty: false },
    ...(search
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { bio: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const profiles = await prisma.profile.findMany({
    where,
    select: {
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
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const hasMore = skip + profiles.length < remaining && profiles.length === take;

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
