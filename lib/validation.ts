import { z } from "zod";
import {
  INTENTIONS,
  MIN_AGE,
  MAX_AGE,
  MARITAL_STATUSES,
  RELIGIONS,
  MADHHABS,
  PRAYER_HABITS,
  HIJAB_OPTIONS,
  QURAN_LEVELS,
  SUBSTANCE_USE_OPTIONS,
  EDUCATION_LEVELS,
  BODY_TYPES,
  SKIN_TONES,
  INCOME_RANGES,
  DISABILITY_TYPES,
  GUARDIAN_RELATIONSHIPS,
} from "@/lib/onboarding";
import { getAge } from "@/lib/dates";
import { TANZANIA_REGIONS } from "@/lib/geo";
import { REPORT_REASONS } from "@/lib/reports";
import { SUPPORT_CATEGORIES } from "@/lib/support";

// Tanzanian phone numbers: 07XXXXXXXX / 06XXXXXXXX or +2557XXXXXXXX / +2556XXXXXXXX
const phoneRegex = /^(?:\+255|0)([67]\d{8})$/;

// Field-level messages are locale-dependent (see lib/i18n/api.ts's
// `dict.validation`), so schemas built from this type are constructed fresh
// per-request from the caller's locale rather than exported as static
// schemas with baked-in Swahili strings.
type ValidationMessages = {
  nameTooShort: string;
  invalidPhone: string;
  invalidEmail: string;
  passwordTooShort: string;
  identifierRequired: string;
  passwordRequired: string;
  otpCodeFormat: string;
  mustAgreeToTerms: string;
  passwordsDoNotMatch: string;
  minAgeRequired: string;
  chooseCountry: string;
  regionRequired: string;
  cityRequired: string;
  religionRequired: string;
  chooseAnswer: string;
  occupationRequired: string;
  chooseAtLeastOne: string;
  bioTooShort: string;
  minAgeExceedsMaxAge: string;
  guardianNameRequired: string;
  chooseRelationship: string;
  guardianPhoneRequired: string;
  messageBodyRequired: string;
  currentPasswordRequired: string;
  newPasswordTooShort: string;
  deletePasswordRequired: string;
  deleteConfirmationMismatch: string;
  reportDescriptionTooShort: string;
  invalidRegion: string;
  invalidChoice: string;
  invalidRequest: string;
  messageTooShort: string;
};

export function createRegisterSchema(t: ValidationMessages) {
  return z
    .object({
      name: z.string().trim().min(2, t.nameTooShort).max(80),
      phone: z.string().regex(phoneRegex, t.invalidPhone),
      email: z.string().trim().email(t.invalidEmail),
      password: z.string().min(8, t.passwordTooShort),
      confirmPassword: z.string(),
      gender: z.enum(["MALE", "FEMALE"]),
      agreedToTerms: z.literal(true, { message: t.mustAgreeToTerms }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.passwordsDoNotMatch,
      path: ["confirmPassword"],
    });
}

export function createVerifyOtpSchema(t: ValidationMessages) {
  return z.object({
    userId: z.string().min(1),
    code: z.string().regex(/^\d{6}$/, t.otpCodeFormat),
  });
}

export function createLoginSchema(t: ValidationMessages) {
  return z.object({
    identifier: z.string().trim().min(1, t.identifierRequired),
    password: z.string().min(1, t.passwordRequired),
  });
}

export function createOrderSchema(t: ValidationMessages) {
  return z.object({
    packageTier: z.enum(["FREE", "BASIC", "SILVER", "GOLD", "PREMIUM"], { message: t.invalidRequest }),
  });
}

export function createInitiatePaymentSchema(t: ValidationMessages) {
  return z.object({
    orderId: z.string().min(1),
    phoneNumber: z.string().regex(phoneRegex, t.invalidPhone),
  });
}

export function createSendMessageSchema(t: ValidationMessages) {
  return z.object({
    receiverId: z.string().min(1),
    body: z.string().trim().min(1, t.messageBodyRequired).max(2000),
  });
}

// Parsed from FormData (multipart, since the attachment is an optional file
// alongside these fields) — mirrors reportCreateSchema's shape.
export function createContactFormSchema(t: ValidationMessages) {
  return z.object({
    name: z.string().trim().min(2, t.nameTooShort).max(80),
    email: z.string().trim().email(t.invalidEmail),
    phone: z.string().trim().max(20).optional().or(z.literal("")),
    category: z.enum(SUPPORT_CATEGORIES).optional().or(z.literal("")),
    subject: z.string().trim().max(120).optional().or(z.literal("")),
    body: z.string().trim().min(5, t.messageTooShort).max(2000),
  });
}

export function createDevActivateSchema(t: ValidationMessages) {
  return z.object({
    userId: z.string().min(1, t.invalidRequest),
    packageTier: z.enum(["FREE", "BASIC", "SILVER", "GOLD", "PREMIUM"], { message: t.invalidRequest }),
  });
}

export function createOnboardingPersonalSchema(t: ValidationMessages) {
  return z.object({
    displayName: z.string().trim().min(2, t.nameTooShort).max(80),
    dob: z.coerce
      .date()
      .refine((d) => getAge(d) >= MIN_AGE, t.minAgeRequired.replace("{minAge}", String(MIN_AGE))),
    country: z.string().trim().length(2, t.chooseCountry).toUpperCase(),
    region: z.string().trim().min(2, t.regionRequired).max(80),
    city: z.string().trim().min(2, t.cityRequired).max(80),
    maritalStatus: z.enum(MARITAL_STATUSES),
  });
}

/**
 * Madhhab, prayer habit, Qur'an level, and hijab are Islam-specific practice
 * questions — the form only asks them (and only requires them) when the
 * chosen religion is Islam; wearsHijab is additionally gated on the
 * profile's stored gender (looked up server-side, never trusted from the
 * client — see app/api/onboarding/religion/route.ts).
 */
export function createOnboardingReligionSchema(requireHijab: boolean, t: ValidationMessages) {
  return z
    .object({
      religion: z.enum(RELIGIONS, { message: t.religionRequired }),
      madhhab: z.enum(MADHHABS).optional(),
      prayerHabit: z.enum(PRAYER_HABITS).optional(),
      quranLevel: z.enum(QURAN_LEVELS).optional(),
      substanceUse: z.enum(SUBSTANCE_USE_OPTIONS),
      wearsHijab: z.enum(HIJAB_OPTIONS).optional(),
    })
    .refine((data) => data.religion !== "UISLAMU" || !!data.madhhab, {
      message: t.chooseAnswer,
      path: ["madhhab"],
    })
    .refine((data) => data.religion !== "UISLAMU" || !!data.prayerHabit, {
      message: t.chooseAnswer,
      path: ["prayerHabit"],
    })
    .refine((data) => data.religion !== "UISLAMU" || !!data.quranLevel, {
      message: t.chooseAnswer,
      path: ["quranLevel"],
    })
    .refine((data) => !requireHijab || data.religion !== "UISLAMU" || !!data.wearsHijab, {
      message: t.chooseAnswer,
      path: ["wearsHijab"],
    });
}

export function createOnboardingLifeSchema(t: ValidationMessages) {
  return z
    .object({
      occupation: z.string().trim().min(2, t.occupationRequired).max(120),
      educationLevel: z.enum(EDUCATION_LEVELS),
      height: z.coerce.number().int().min(100).max(250),
      bodyType: z.enum(BODY_TYPES),
      skinTone: z.enum(SKIN_TONES),
      incomeRange: z.enum(INCOME_RANGES).optional(),
      hasDisability: z.boolean().optional(),
      disabilityType: z.enum(DISABILITY_TYPES).nullable().optional(),
      intentions: z.array(z.enum(INTENTIONS)).min(1, t.chooseAtLeastOne),
      partnerAgeMin: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE),
      partnerAgeMax: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE),
      bio: z.string().trim().min(10, t.bioTooShort).max(300),
    })
    .refine((data) => data.partnerAgeMin <= data.partnerAgeMax, {
      message: t.minAgeExceedsMaxAge,
      path: ["partnerAgeMin"],
    })
    .refine((data) => !data.hasDisability || !!data.disabilityType, {
      message: t.chooseAnswer,
      path: ["disabilityType"],
    });
}

export function createOnboardingGuardianSchema(t: ValidationMessages) {
  return z
    .object({
      hasGuardian: z.boolean(),
      guardianName: z.string().trim().max(80).optional(),
      guardianRelationship: z.enum(GUARDIAN_RELATIONSHIPS).optional(),
      guardianPhone: z.string().regex(phoneRegex, t.invalidPhone).optional(),
    })
    .refine((data) => !data.hasGuardian || !!data.guardianName, {
      message: t.guardianNameRequired,
      path: ["guardianName"],
    })
    .refine((data) => !data.hasGuardian || !!data.guardianRelationship, {
      message: t.chooseRelationship,
      path: ["guardianRelationship"],
    })
    .refine((data) => !data.hasGuardian || !!data.guardianPhone, {
      message: t.guardianPhoneRequired,
      path: ["guardianPhone"],
    });
}

export function createFavoriteSchema(t: ValidationMessages) {
  return z.object({
    favoritedUserId: z.string().min(1, t.invalidRequest),
  });
}

export function createBlockSchema(t: ValidationMessages) {
  return z.object({
    blockedUserId: z.string().min(1, t.invalidRequest),
  });
}

export function createChangePasswordSchema(t: ValidationMessages) {
  return z
    .object({
      currentPassword: z.string().min(1, t.currentPasswordRequired),
      newPassword: z.string().min(8, t.newPasswordTooShort),
      confirmNewPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: t.passwordsDoNotMatch,
      path: ["confirmNewPassword"],
    });
}

export const DELETE_ACCOUNT_CONFIRMATION = "FUTA";

export function createDeleteAccountSchema(t: ValidationMessages) {
  return z.object({
    password: z.string().min(1, t.deletePasswordRequired),
    confirmation: z.literal(DELETE_ACCOUNT_CONFIRMATION, {
      message: t.deleteConfirmationMismatch.replace("{word}", DELETE_ACCOUNT_CONFIRMATION),
    }),
  });
}

// Parsed from FormData (multipart, since evidence is an optional file
// alongside these fields), so booleans arrive as the strings "true"/"false".
export function createReportCreateSchema(t: ValidationMessages) {
  return z.object({
    reportedUserId: z.string().min(1),
    reason: z.enum(REPORT_REASONS),
    description: z.string().trim().min(10, t.reportDescriptionTooShort).max(1000),
    blockAfterSubmit: z
      .string()
      .default("false")
      .transform((v) => v === "true"),
  });
}

// Comma-separated-string-to-array, validated against a fixed value set —
// same shape as the existing `regions` param, reused for every new
// multi-select filter added in the Matches page rebuild.
function csvEnumFilter(allowed: readonly string[], message: string) {
  return z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []))
    .refine((arr) => arr.every((s) => allowed.includes(s)), { message });
}

export const MEMBER_SORT_MODES = ["recent", "best_match"] as const;
export type MemberSortMode = (typeof MEMBER_SORT_MODES)[number];

export function createMemberQuerySchema(t: ValidationMessages) {
  return z
    .object({
      minAge: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
      maxAge: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
      regions: z
        .string()
        .optional()
        .transform((v) => (v ? v.split(",").map((r) => r.trim()).filter(Boolean) : []))
        .refine((arr) => arr.every((r) => (TANZANIA_REGIONS as string[]).includes(r)), {
          message: t.invalidRegion,
        }),
      maritalStatuses: csvEnumFilter(MARITAL_STATUSES, t.invalidChoice),
      madhhabs: csvEnumFilter(MADHHABS, t.invalidChoice),
      hijab: csvEnumFilter(HIJAB_OPTIONS, t.invalidChoice),
      intentions: csvEnumFilter(INTENTIONS, t.invalidChoice),
      search: z.string().trim().max(80).optional(),
      page: z.coerce.number().int().min(1).max(1000).default(1),
      favoritesOnly: z.coerce.boolean().optional().default(false),
      verifiedOnly: z.coerce.boolean().optional().default(false),
      sort: z.enum(MEMBER_SORT_MODES).optional().default("recent"),
    })
    .refine((v) => v.minAge === undefined || v.maxAge === undefined || v.minAge <= v.maxAge, {
      message: t.minAgeExceedsMaxAge,
      path: ["minAge"],
    });
}

export function normalizePhone(phone: string): string {
  const match = phone.match(phoneRegex);
  if (!match) return phone;
  return `0${match[1]}`;
}

export function isPhoneNumber(identifier: string): boolean {
  return phoneRegex.test(identifier.trim());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
