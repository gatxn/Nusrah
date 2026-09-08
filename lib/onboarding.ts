import type { Profile } from "@prisma/client";
import { getAge } from "@/lib/dates";

// Pure constants/types/derivations only — no "next/headers" or Prisma client
// imports here, so this file stays safe to import from Client Components
// (see PersonalDetailsForm.tsx, LifeForm.tsx). Server-only guards
// (getOwnProfile, requireOnboardingStep, requireOnboardingReady) live in
// lib/onboarding-server.ts instead.

export type OnboardingStep = "personal" | "religion" | "life";
export type OnboardingStepOrExtra = OnboardingStep | "guardian" | "photo";

export const STEP_ROUTES: Record<OnboardingStepOrExtra, string> = {
  personal: "/onboarding/personal",
  religion: "/onboarding/religion",
  life: "/onboarding/life",
  guardian: "/onboarding/guardian",
  photo: "/onboarding/photo",
};

export const STEP_NUMBER: Record<OnboardingStepOrExtra, number> = {
  personal: 1,
  religion: 2,
  life: 3,
  guardian: 4,
  photo: 5,
};

export const INTENTIONS = [
  "MPENZI_WA_NDOA",
  "MWENZI_MUDA_MREFU",
  "MARAFIKI_WAPYA",
  "BADO_SIJAAMUA",
] as const;
export type Intention = (typeof INTENTIONS)[number];

export function isIntention(value: string): value is Intention {
  return (INTENTIONS as readonly string[]).includes(value);
}

export const MARITAL_STATUSES = ["AMEOA_AMEOLEWA", "SIJAOA_SIJAOLEWA", "TALAKA", "MJANE", "AMETENGANA"] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];
export function isMaritalStatus(value: string): value is MaritalStatus {
  return (MARITAL_STATUSES as readonly string[]).includes(value);
}

export const RELIGIONS = ["UISLAMU", "UKRISTO", "UHINDU", "DINI_ASILIA", "SINA_DINI", "NYINGINE"] as const;
export type Religion = (typeof RELIGIONS)[number];
export function isReligion(value: string): value is Religion {
  return (RELIGIONS as readonly string[]).includes(value);
}

export const MADHHABS = ["HANAFI", "SHAFII", "MALIKI", "HANBALI", "SINA_MADHHAB_MAALUM"] as const;
export type Madhhab = (typeof MADHHABS)[number];
export function isMadhhab(value: string): value is Madhhab {
  return (MADHHABS as readonly string[]).includes(value);
}

export const PRAYER_HABITS = ["MARA_TANO", "MARA_KWA_MARA", "NINAJITAHIDI", "SIFANYI_SASA"] as const;
export type PrayerHabit = (typeof PRAYER_HABITS)[number];
export function isPrayerHabit(value: string): value is PrayerHabit {
  return (PRAYER_HABITS as readonly string[]).includes(value);
}

export const HIJAB_OPTIONS = ["NDIYO", "HAPANA", "WAKATI_MWINGINE"] as const;
export type HijabOption = (typeof HIJAB_OPTIONS)[number];
export function isHijabOption(value: string): value is HijabOption {
  return (HIJAB_OPTIONS as readonly string[]).includes(value);
}

export const QURAN_LEVELS = ["NINASOMA_KWA_UFASAHA", "NINASOMA_KAWAIDA", "BADO_NINAJIFUNZA", "SIJUI_KUSOMA"] as const;
export type QuranLevel = (typeof QURAN_LEVELS)[number];
export function isQuranLevel(value: string): value is QuranLevel {
  return (QURAN_LEVELS as readonly string[]).includes(value);
}

export const SUBSTANCE_USE_OPTIONS = ["SITUMII_KABISA", "MARA_CHACHE", "MARA_KWA_MARA"] as const;
export type SubstanceUseOption = (typeof SUBSTANCE_USE_OPTIONS)[number];
export function isSubstanceUseOption(value: string): value is SubstanceUseOption {
  return (SUBSTANCE_USE_OPTIONS as readonly string[]).includes(value);
}

export const EDUCATION_LEVELS = ["MSINGI", "SEKONDARI", "KIDATO_CHA_SITA", "STASHAHADA", "SHAHADA", "UZAMILI_UZAMIVU"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export function isEducationLevel(value: string): value is EducationLevel {
  return (EDUCATION_LEVELS as readonly string[]).includes(value);
}

export const BODY_TYPES = ["MWEMBAMBA", "WASTANI", "MNENE"] as const;
export type BodyType = (typeof BODY_TYPES)[number];
export function isBodyType(value: string): value is BodyType {
  return (BODY_TYPES as readonly string[]).includes(value);
}

// Optional and deliberately not part of isLifeComplete's required checks —
// disability status is sensitive, so answering "Una ulemavu wowote?" is
// always skippable, matching incomeRange's "one exception to required"
// precedent just above.
export const DISABILITY_TYPES = ["MIGUU", "MIKONO", "UPOFU", "UZIWI", "NYINGINE", "SIHITAJI_KUSEMA"] as const;
export type DisabilityType = (typeof DISABILITY_TYPES)[number];
export function isDisabilityType(value: string): value is DisabilityType {
  return (DISABILITY_TYPES as readonly string[]).includes(value);
}

export const SKIN_TONES = ["NYEUSI", "KAHAWIA_ILIYOKOZA", "KAHAWIA", "NYEUPE"] as const;
export type SkinTone = (typeof SKIN_TONES)[number];
export function isSkinTone(value: string): value is SkinTone {
  return (SKIN_TONES as readonly string[]).includes(value);
}

export const INCOME_RANGES = ["CHINI_YA_300K", "300K_HADI_700K", "700K_HADI_1_5M", "ZAIDI_YA_1_5M", "SIPENDI_KUTAJA"] as const;
export type IncomeRange = (typeof INCOME_RANGES)[number];
export function isIncomeRange(value: string): value is IncomeRange {
  return (INCOME_RANGES as readonly string[]).includes(value);
}

export const GUARDIAN_RELATIONSHIPS = ["BABA", "KAKA", "MJOMBA", "BABU", "MWINGINE"] as const;
export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];

// Common adult height range, in cm.
export const HEIGHT_OPTIONS_CM: number[] = Array.from({ length: 71 }, (_, i) => 140 + i);

export const MIN_AGE = 18;
export const MAX_AGE = 100;

// A profile counts as "New" on the Matches page for this many days after creation.
export const NEW_PROFILE_WINDOW_DAYS = 14;

// Members grid page size — shared by the server query builder (lib/profiles.ts)
// and the client filter UI (components/wanachama/*) so they never drift.
export const MEMBERS_PAGE_SIZE = 20;

export type OnboardingProfile = Pick<
  Profile,
  | "dob"
  | "country"
  | "region"
  | "city"
  | "displayName"
  | "maritalStatus"
  | "gender"
  | "religion"
  | "madhhab"
  | "prayerHabit"
  | "wearsHijab"
  | "quranLevel"
  | "substanceUse"
  | "occupation"
  | "educationLevel"
  | "height"
  | "bodyType"
  | "skinTone"
  | "intentions"
  | "partnerAgeMin"
  | "partnerAgeMax"
  | "bio"
> | null;

export function isPersonalComplete(profile: OnboardingProfile): boolean {
  return (
    !!profile?.dob &&
    getAge(profile.dob) >= MIN_AGE &&
    !!profile?.country &&
    !!profile?.region &&
    !!profile?.city &&
    !!profile?.displayName &&
    !!profile?.maritalStatus
  );
}

export function isReligionComplete(profile: OnboardingProfile): boolean {
  if (!profile) return false;
  if (!profile.religion || !profile.substanceUse) return false;
  // Madhhab, prayer habit, Qur'an level, and hijab are Islam-specific
  // practice questions — only required (and only ever asked, see
  // ReligionForm.tsx) when the profile's own religion is Islam.
  if (profile.religion === "UISLAMU") {
    if (!profile.madhhab || !profile.prayerHabit || !profile.quranLevel) return false;
    if (profile.gender === "FEMALE" && !profile.wearsHijab) return false;
  }
  return true;
}

export function isLifeComplete(profile: OnboardingProfile): boolean {
  return (
    !!profile?.occupation &&
    !!profile?.educationLevel &&
    !!profile?.height &&
    !!profile?.bodyType &&
    !!profile?.skinTone &&
    !!profile?.intentions?.length &&
    !!profile?.partnerAgeMin &&
    !!profile?.partnerAgeMax &&
    !!profile?.bio
  );
}

/**
 * Derived, never stored: which required step (if any) the profile is still
 * missing. Steps 1-3 are mandatory and gate the rest of the site (see
 * app/[locale]/(main)/layout.tsx); Steps 4-5 (guardian/photo) are
 * intentionally excluded from this chain since both are optional.
 */
export function getNextIncompleteStep(profile: OnboardingProfile): OnboardingStep | null {
  if (!isPersonalComplete(profile)) return "personal";
  if (!isReligionComplete(profile)) return "religion";
  if (!isLifeComplete(profile)) return "life";
  return null;
}

export function isOnboardingComplete(profile: OnboardingProfile): boolean {
  return getNextIncompleteStep(profile) === null;
}

export function hasPhoto(profile: Pick<Profile, "photoEnc"> | null): boolean {
  return !!profile?.photoEnc;
}

/** Where a "save & continue" API response should send the client next. */
export function nextStepRoute(profile: OnboardingProfile): string {
  const next = getNextIncompleteStep(profile);
  return next ? STEP_ROUTES[next] : STEP_ROUTES.guardian;
}
