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
  "MWENZI_MUDA_MFUPI",
  "MARAFIKI_WAPYA",
  "BADO_SIJAAMUA",
] as const;
export type Intention = (typeof INTENTIONS)[number];

export const INTENTION_LABELS: Record<Intention, string> = {
  MPENZI_WA_NDOA: "Mpenzi wa Ndoa ya Kudumu",
  MWENZI_MUDA_MREFU: "Mwenzi wa Muda Mrefu",
  MWENZI_MUDA_MFUPI: "Mwenzi wa Muda Mfupi",
  MARAFIKI_WAPYA: "Marafiki Wapya",
  BADO_SIJAAMUA: "Bado Sijaamua",
};

export function isIntention(value: string): value is Intention {
  return (INTENTIONS as readonly string[]).includes(value);
}

export const MARITAL_STATUSES = ["SIJAOA_SIJAOLEWA", "TALAKA", "MJANE", "AMETENGANA"] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];
export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  SIJAOA_SIJAOLEWA: "Sijaoa/Sijaolewa",
  TALAKA: "Nimeachika",
  MJANE: "Mjane",
  AMETENGANA: "Tumetengana",
};

export const MADHHABS = ["HANAFI", "SHAFII", "MALIKI", "HANBALI", "SINA_MADHHAB_MAALUM"] as const;
export type Madhhab = (typeof MADHHABS)[number];
export const MADHHAB_LABELS: Record<Madhhab, string> = {
  HANAFI: "Hanafi",
  SHAFII: "Shafii",
  MALIKI: "Maliki",
  HANBALI: "Hanbali",
  SINA_MADHHAB_MAALUM: "Sina Madhhab Maalum",
};

export const PRAYER_HABITS = ["MARA_TANO", "MARA_KWA_MARA", "NINAJITAHIDI", "SIFANYI_SASA"] as const;
export type PrayerHabit = (typeof PRAYER_HABITS)[number];
export const PRAYER_HABIT_LABELS: Record<PrayerHabit, string> = {
  MARA_TANO: "Ninaswali Mara 5 kwa Siku",
  MARA_KWA_MARA: "Ninaswali Mara kwa Mara",
  NINAJITAHIDI: "Ninajitahidi Kuswali",
  SIFANYI_SASA: "Sifanyi Swala kwa Sasa",
};

export const HIJAB_OPTIONS = ["NDIYO", "HAPANA", "WAKATI_MWINGINE"] as const;
export type HijabOption = (typeof HIJAB_OPTIONS)[number];
export const HIJAB_OPTION_LABELS: Record<HijabOption, string> = {
  NDIYO: "Ndiyo",
  HAPANA: "Hapana",
  WAKATI_MWINGINE: "Wakati Mwingine",
};

export const QURAN_LEVELS = ["NINASOMA_KWA_UFASAHA", "NINASOMA_KAWAIDA", "BADO_NINAJIFUNZA", "SIJUI_KUSOMA"] as const;
export type QuranLevel = (typeof QURAN_LEVELS)[number];
export const QURAN_LEVEL_LABELS: Record<QuranLevel, string> = {
  NINASOMA_KWA_UFASAHA: "Ninasoma kwa Ufasaha",
  NINASOMA_KAWAIDA: "Ninasoma kwa Kawaida",
  BADO_NINAJIFUNZA: "Bado Ninajifunza",
  SIJUI_KUSOMA: "Sijui Kusoma",
};

export const SUBSTANCE_USE_OPTIONS = ["SITUMII_KABISA", "MARA_CHACHE", "MARA_KWA_MARA"] as const;
export type SubstanceUseOption = (typeof SUBSTANCE_USE_OPTIONS)[number];
export const SUBSTANCE_USE_LABELS: Record<SubstanceUseOption, string> = {
  SITUMII_KABISA: "Situmii Kabisa",
  MARA_CHACHE: "Mara Chache",
  MARA_KWA_MARA: "Mara kwa Mara",
};

export const EDUCATION_LEVELS = ["MSINGI", "SEKONDARI", "KIDATO_CHA_SITA", "STASHAHADA", "SHAHADA", "UZAMILI_UZAMIVU"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  MSINGI: "Shule ya Msingi",
  SEKONDARI: "Sekondari",
  KIDATO_CHA_SITA: "Kidato cha Sita",
  STASHAHADA: "Astashahada/Stashahada",
  SHAHADA: "Shahada",
  UZAMILI_UZAMIVU: "Shahada ya Uzamili/Uzamivu",
};

export const BODY_TYPES = ["MWEMBAMBA", "WASTANI", "MNENE"] as const;
export type BodyType = (typeof BODY_TYPES)[number];
export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  MWEMBAMBA: "Mwembamba",
  WASTANI: "Wastani",
  MNENE: "Mnene",
};

export const SKIN_TONES = ["NYEUSI", "KAHAWIA_ILIYOKOZA", "KAHAWIA", "NYEUPE"] as const;
export type SkinTone = (typeof SKIN_TONES)[number];
export const SKIN_TONE_LABELS: Record<SkinTone, string> = {
  NYEUSI: "Nyeusi",
  KAHAWIA_ILIYOKOZA: "Kahawia Iliyokoza",
  KAHAWIA: "Kahawia",
  NYEUPE: "Nyeupe",
};

export const INCOME_RANGES = ["CHINI_YA_300K", "300K_HADI_700K", "700K_HADI_1_5M", "ZAIDI_YA_1_5M", "SIPENDI_KUTAJA"] as const;
export type IncomeRange = (typeof INCOME_RANGES)[number];
export const INCOME_RANGE_LABELS: Record<IncomeRange, string> = {
  CHINI_YA_300K: "Chini ya TZS 300,000",
  "300K_HADI_700K": "TZS 300,000 - 700,000",
  "700K_HADI_1_5M": "TZS 700,000 - 1,500,000",
  ZAIDI_YA_1_5M: "Zaidi ya TZS 1,500,000",
  SIPENDI_KUTAJA: "Sipendi Kutaja",
};

export const GUARDIAN_RELATIONSHIPS = ["BABA", "KAKA", "MJOMBA", "BABU", "MWINGINE"] as const;
export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];
export const GUARDIAN_RELATIONSHIP_LABELS: Record<GuardianRelationship, string> = {
  BABA: "Baba",
  KAKA: "Kaka",
  MJOMBA: "Mjomba",
  BABU: "Babu",
  MWINGINE: "Mwingine",
};

// Common adult height range, in cm.
export const HEIGHT_OPTIONS_CM: number[] = Array.from({ length: 71 }, (_, i) => 140 + i);

export const MIN_AGE = 18;
export const MAX_AGE = 100;

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
  const baseComplete =
    !!profile.religion && !!profile.madhhab && !!profile.prayerHabit && !!profile.quranLevel && !!profile.substanceUse;
  if (!baseComplete) return false;
  if (profile.gender === "FEMALE") return !!profile.wearsHijab;
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

export function hasIdDocument(profile: Pick<Profile, "idDocumentEnc"> | null): boolean {
  return !!profile?.idDocumentEnc;
}

/** Where a "save & continue" API response should send the client next. */
export function nextStepRoute(profile: OnboardingProfile): string {
  const next = getNextIncompleteStep(profile);
  return next ? STEP_ROUTES[next] : STEP_ROUTES.guardian;
}
