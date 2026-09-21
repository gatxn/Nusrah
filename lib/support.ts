export const SUPPORT_CATEGORIES = [
  "ACCOUNT_LOGIN",
  "PROFILE_VERIFICATION",
  "PAYMENTS_SUBSCRIPTION",
  "SAFETY_REPORT",
  "MESSAGES_COMMUNICATION",
  "PRIVACY_DATA",
  "TECHNICAL_PROBLEM",
  "TERMS_POLICY",
  "OTHER",
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export function isSupportCategory(value: string): value is SupportCategory {
  return (SUPPORT_CATEGORIES as readonly string[]).includes(value);
}

export function formatTicketNumber(seq: number): string {
  return `NS-${String(seq).padStart(6, "0")}`;
}
