import type { Profile } from "@prisma/client";
import { getAge } from "@/lib/dates";

// Pure constants/types/derivations only — no "next/headers" or Prisma client
// imports here, so this file stays safe to import from Client Components
// (see PersonalDetailsForm.tsx, IntentionsForm.tsx). Server-only guards
// (getOwnProfile, requireOnboardingStep, requireOnboardingReady) live in
// lib/onboarding-server.ts instead.

export type OnboardingStep = "personal" | "address" | "intentions";
export type OnboardingStepOrPhoto = OnboardingStep | "photo";

export const STEP_ROUTES: Record<OnboardingStepOrPhoto, string> = {
  personal: "/onboarding/personal",
  address: "/onboarding/address",
  intentions: "/onboarding/intentions",
  photo: "/onboarding/photo",
};

export const STEP_NUMBER: Record<OnboardingStepOrPhoto, number> = {
  personal: 1,
  address: 2,
  intentions: 3,
  photo: 4,
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

export const MIN_AGE = 18;
export const MAX_AGE = 100;

// Members grid page size — shared by the server query builder (lib/profiles.ts)
// and the client filter UI (components/wanachama/*) so they never drift.
export const MEMBERS_PAGE_SIZE = 20;

export type OnboardingProfile = Pick<
  Profile,
  "dob" | "country" | "region" | "city" | "intentions"
> | null;

export function isPersonalComplete(profile: OnboardingProfile): boolean {
  return !!profile?.dob && getAge(profile.dob) >= MIN_AGE;
}

export function isAddressComplete(profile: OnboardingProfile): boolean {
  return !!profile?.country && !!profile?.region && !!profile?.city;
}

export function isIntentionsComplete(profile: OnboardingProfile): boolean {
  return !!profile?.intentions?.length;
}

/**
 * Derived, never stored: which required step (if any) the profile is still
 * missing. Steps 1-3 are mandatory and gate the rest of the site (see
 * app/(main)/layout.tsx); Step 4 (photo) is intentionally excluded from this
 * chain since it's optional.
 */
export function getNextIncompleteStep(profile: OnboardingProfile): OnboardingStep | null {
  if (!isPersonalComplete(profile)) return "personal";
  if (!isAddressComplete(profile)) return "address";
  if (!isIntentionsComplete(profile)) return "intentions";
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
  return next ? STEP_ROUTES[next] : STEP_ROUTES.photo;
}
