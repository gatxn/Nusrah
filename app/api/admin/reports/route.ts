import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { queryAdminReports, isReportStatus } from "@/lib/admin/reports";

// Separate from the existing member-facing app/api/reports/route.ts
// (POST-only, creates a report) — this is a new, admin-only GET, not an
// added method on that file.
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const statusParam = searchParams.get("status");
  const status = isReportStatus(statusParam) ? statusParam : undefined;

  const result = await queryAdminReports({ page, status });
  return NextResponse.json(result);
}
