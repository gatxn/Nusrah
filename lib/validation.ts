import { z } from "zod";
import {
  INTENTIONS,
  MIN_AGE,
  MAX_AGE,
  MARITAL_STATUSES,
  MADHHABS,
  PRAYER_HABITS,
  HIJAB_OPTIONS,
  QURAN_LEVELS,
  SUBSTANCE_USE_OPTIONS,
  EDUCATION_LEVELS,
  BODY_TYPES,
  SKIN_TONES,
  INCOME_RANGES,
  GUARDIAN_RELATIONSHIPS,
} from "@/lib/onboarding";
import { getAge } from "@/lib/dates";
import { TANZANIA_REGIONS } from "@/lib/geo";
import { REPORT_REASONS } from "@/lib/reports";
import { SUPPORT_CATEGORIES } from "@/lib/support";

// Tanzanian phone numbers: 07XXXXXXXX / 06XXXXXXXX or +2557XXXXXXXX / +2556XXXXXXXX
const phoneRegex = /^(?:\+255|0)([67]\d{8})$/;

// Field-level messages are locale-dependent (see lib/i18n/api.ts's
// `dict.validation`), so these three schemas — used only by the auth routes
// — are built fresh per-request from the caller's locale rather than
// exported as static schemas with baked-in Swahili strings.
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

export const createOrderSchema = z.object({
  packageTier: z.enum(["FREE", "BASIC", "SILVER", "GOLD", "PREMIUM"]),
});

export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1),
  phoneNumber: z.string().regex(phoneRegex, "Namba ya simu si sahihi"),
});

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1),
  body: z.string().trim().min(1, "Andika ujumbe").max(2000),
});

// Parsed from FormData (multipart, since the attachment is an optional file
// alongside these fields) — mirrors reportCreateSchema's shape.
export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  category: z.enum(SUPPORT_CATEGORIES).optional().or(z.literal("")),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(5).max(2000),
});

export const devActivateSchema = z.object({
  userId: z.string().min(1),
  packageTier: z.enum(["FREE", "BASIC", "SILVER", "GOLD", "PREMIUM"]),
});

export const onboardingPersonalSchema = z.object({
  displayName: z.string().trim().min(2, "Jina ni fupi mno").max(80),
  dob: z.coerce.date().refine(
    (d) => getAge(d) >= MIN_AGE,
    `Lazima uwe na umri wa miaka ${MIN_AGE} au zaidi kutumia Nusrah.`
  ),
  country: z.string().trim().length(2, "Chagua nchi").toUpperCase(),
  region: z.string().trim().min(2, "Jaza mkoa/jimbo").max(80),
  city: z.string().trim().min(2, "Jaza wilaya/eneo").max(80),
  maritalStatus: z.enum(MARITAL_STATUSES),
});

/**
 * wearsHijab is only required when the profile's stored gender (looked up
 * server-side, never trusted from the client) is female — see
 * app/api/onboarding/religion/route.ts.
 */
export function createOnboardingReligionSchema(requireHijab: boolean) {
  const base = z.object({
    religion: z.string().trim().min(2, "Jaza dini yako").max(80),
    madhhab: z.enum(MADHHABS),
    prayerHabit: z.enum(PRAYER_HABITS),
    quranLevel: z.enum(QURAN_LEVELS),
    substanceUse: z.enum(SUBSTANCE_USE_OPTIONS),
    wearsHijab: z.enum(HIJAB_OPTIONS).optional(),
  });
  if (!requireHijab) return base;
  return base.refine((data) => !!data.wearsHijab, {
    message: "Chagua jibu",
    path: ["wearsHijab"],
  });
}

export const onboardingLifeSchema = z
  .object({
    occupation: z.string().trim().min(2, "Eleza kazi yako").max(120),
    educationLevel: z.enum(EDUCATION_LEVELS),
    height: z.coerce.number().int().min(100).max(250),
    bodyType: z.enum(BODY_TYPES),
    skinTone: z.enum(SKIN_TONES),
    incomeRange: z.enum(INCOME_RANGES).optional(),
    intentions: z.array(z.enum(INTENTIONS)).min(1, "Chagua angalau chaguo moja"),
    partnerAgeMin: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE),
    partnerAgeMax: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE),
    bio: z.string().trim().min(10, "Eleza kidogo zaidi kuhusu wewe").max(300),
  })
  .refine((data) => data.partnerAgeMin <= data.partnerAgeMax, {
    message: "Umri wa chini hauwezi kuzidi umri wa juu",
    path: ["partnerAgeMin"],
  });

export const onboardingGuardianSchema = z
  .object({
    hasGuardian: z.boolean(),
    guardianName: z.string().trim().max(80).optional(),
    guardianRelationship: z.enum(GUARDIAN_RELATIONSHIPS).optional(),
    guardianPhone: z.string().regex(phoneRegex, "Namba ya simu si sahihi").optional(),
  })
  .refine((data) => !data.hasGuardian || !!data.guardianName, {
    message: "Jaza jina la mlezi",
    path: ["guardianName"],
  })
  .refine((data) => !data.hasGuardian || !!data.guardianRelationship, {
    message: "Chagua uhusiano",
    path: ["guardianRelationship"],
  })
  .refine((data) => !data.hasGuardian || !!data.guardianPhone, {
    message: "Jaza namba ya simu ya mlezi",
    path: ["guardianPhone"],
  });

export const favoriteCreateSchema = z.object({
  favoritedUserId: z.string().min(1),
});

export const blockCreateSchema = z.object({
  blockedUserId: z.string().min(1),
});

// Parsed from FormData (multipart, since evidence is an optional file
// alongside these fields), so booleans arrive as the strings "true"/"false".
export const reportCreateSchema = z.object({
  reportedUserId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  description: z.string().trim().min(10, "Eleza kilichotokea kwa ufupi zaidi").max(1000),
  blockAfterSubmit: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

export const memberQuerySchema = z
  .object({
    minAge: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
    maxAge: z.coerce.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
    regions: z
      .string()
      .optional()
      .transform((v) => (v ? v.split(",").map((r) => r.trim()).filter(Boolean) : []))
      .refine((arr) => arr.every((r) => (TANZANIA_REGIONS as string[]).includes(r)), {
        message: "Mkoa haujakubalika",
      }),
    search: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    favoritesOnly: z.coerce.boolean().optional().default(false),
  })
  .refine((v) => v.minAge === undefined || v.maxAge === undefined || v.minAge <= v.maxAge, {
    message: "Umri wa chini hauwezi kuzidi umri wa juu",
    path: ["minAge"],
  });

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
