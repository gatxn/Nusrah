import { z } from "zod";
import { INTENTIONS, MIN_AGE, MAX_AGE } from "@/lib/onboarding";
import { getAge } from "@/lib/dates";
import { TANZANIA_REGIONS } from "@/lib/geo";

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
};

export function createRegisterSchema(t: ValidationMessages) {
  return z.object({
    name: z.string().trim().min(2, t.nameTooShort).max(80),
    phone: z.string().regex(phoneRegex, t.invalidPhone),
    email: z.string().trim().email(t.invalidEmail),
    password: z.string().min(8, t.passwordTooShort),
    gender: z.enum(["MALE", "FEMALE"]),
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

export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  subject: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(5).max(2000),
});

export const devActivateSchema = z.object({
  userId: z.string().min(1),
  packageTier: z.enum(["FREE", "BASIC", "SILVER", "GOLD", "PREMIUM"]),
});

export const onboardingPersonalSchema = z.object({
  dob: z.coerce.date().refine(
    (d) => getAge(d) >= MIN_AGE,
    `Lazima uwe na umri wa miaka ${MIN_AGE} au zaidi kutumia Nusrah.`
  ),
});

export const onboardingAddressSchema = z.object({
  country: z.string().trim().length(2, "Chagua nchi").toUpperCase(),
  region: z.string().trim().min(2, "Jaza mkoa/jimbo").max(80),
  city: z.string().trim().min(2, "Jaza mji/jiji").max(80),
});

export const onboardingIntentionsSchema = z.object({
  intentions: z
    .array(z.enum(INTENTIONS))
    .min(1, "Chagua angalau chaguo moja"),
});

export const favoriteCreateSchema = z.object({
  favoritedUserId: z.string().min(1),
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
