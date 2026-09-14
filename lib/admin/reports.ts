import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { severityFor, type ReportSeverity } from "@/lib/admin/report-severity";

export const ADMIN_REPORTS_PAGE_SIZE = 20;

export type AdminReportRow = {
  id: string;
  reason: string;
  severity: ReportSeverity;
  status: string;
  createdAt: Date;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
};

export type AdminReportListParams = {
  page: number;
  status?: "PENDING" | "RESOLVED" | "DISMISSED";
};

export async function queryAdminReports(
  params: AdminReportListParams
): Promise<{ reports: AdminReportRow[]; page: number; pageSize: number; totalCount: number }> {
  const { page, status } = params;
  const skip = (page - 1) * ADMIN_REPORTS_PAGE_SIZE;
  const where: Prisma.ReportWhereInput = status ? { status } : {};

  const [rows, totalCount] = await Promise.all([
    prisma.report.findMany({
      where,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        reporterId: true,
        reporter: { select: { name: true } },
        reportedUserId: true,
        reportedUser: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: ADMIN_REPORTS_PAGE_SIZE,
    }),
    prisma.report.count({ where }),
  ]);

  return {
    reports: rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      severity: severityFor(r.reason),
      status: r.status,
      createdAt: r.createdAt,
      reporterId: r.reporterId,
      reporterName: r.reporter.name,
      reportedUserId: r.reportedUserId,
      reportedUserName: r.reportedUser.name,
    })),
    page,
    pageSize: ADMIN_REPORTS_PAGE_SIZE,
    totalCount,
  };
}

export type AdminReportDetail = AdminReportRow & {
  description: string;
  hasEvidence: boolean;
};

export async function getAdminReportDetail(reportId: string): Promise<AdminReportDetail | null> {
  const r = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      reason: true,
      status: true,
      description: true,
      evidenceEnc: true,
      createdAt: true,
      reporterId: true,
      reporter: { select: { name: true } },
      reportedUserId: true,
      reportedUser: { select: { name: true } },
    },
  });
  if (!r) return null;

  return {
    id: r.id,
    reason: r.reason,
    severity: severityFor(r.reason),
    status: r.status,
    createdAt: r.createdAt,
    reporterId: r.reporterId,
    reporterName: r.reporter.name,
    reportedUserId: r.reportedUserId,
    reportedUserName: r.reportedUser.name,
    description: r.description,
    hasEvidence: !!r.evidenceEnc,
  };
}

const VALID_REPORT_STATUSES = ["PENDING", "RESOLVED", "DISMISSED"] as const;
export type ReportStatus = (typeof VALID_REPORT_STATUSES)[number];

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && (VALID_REPORT_STATUSES as readonly string[]).includes(value);
}

export async function setReportStatus(reportId: string, status: ReportStatus): Promise<boolean> {
  const result = await prisma.report.updateMany({ where: { id: reportId }, data: { status } });
  return result.count === 1;
}
