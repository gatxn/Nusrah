import type { ReportReason } from "@/lib/reports";

// Fixed, hardcoded mapping — no severity column exists on Report (and none
// is needed: this is a deterministic business rule, not per-report admin
// judgment), computed at the API layer instead of stored.
const HIGH: ReportReason[] = ["THREATS", "HARASSMENT", "SCAM", "MONEY_REQUEST"];
const MEDIUM: ReportReason[] = ["FAKE_PROFILE", "IMPERSONATION", "FALSE_INFO"];

export type ReportSeverity = "HIGH" | "MEDIUM" | "LOW";

export function severityFor(reason: string): ReportSeverity {
  if ((HIGH as string[]).includes(reason)) return "HIGH";
  if ((MEDIUM as string[]).includes(reason)) return "MEDIUM";
  return "LOW";
}
