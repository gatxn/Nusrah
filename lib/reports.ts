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

export function isReportReason(value: string): value is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(value);
}
