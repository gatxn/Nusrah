export const REPORT_REASONS = [
  "FAKE_PROFILE",
  "SCAM",
  "MONEY_REQUEST",
  "HARASSMENT",
  "THREATS",
  "SPAM",
  "IMPERSONATION",
  "INAPPROPRIATE_CONTENT",
  "FALSE_INFO",
  "TERMS_VIOLATION",
  "OTHER",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  FAKE_PROFILE: "Fake Profile / Akaunti ya Uongo",
  SCAM: "Scam / Utapeli",
  MONEY_REQUEST: "Anaomba Pesa",
  HARASSMENT: "Harassment / Unyanyasaji",
  THREATS: "Vitisho au Intimidation",
  SPAM: "Spam / Ujumbe Usiohitajika",
  IMPERSONATION: "Impersonation / Anajifanya Mtu Mwingine",
  INAPPROPRIATE_CONTENT: "Maudhui Yasiyofaa",
  FALSE_INFO: "Picha au Taarifa za Uongo",
  TERMS_VIOLATION: "Anakiuka Masharti ya Nusrah",
  OTHER: "Sababu Nyingine",
};

export function isReportReason(value: string): value is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(value);
}
