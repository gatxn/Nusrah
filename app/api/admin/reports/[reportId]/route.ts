import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isReportStatus, setReportStatus } from "@/lib/admin/reports";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { reportId } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!isReportStatus(status)) {
    return NextResponse.json({ error: "Invalid report status" }, { status: 400 });
  }

  const updated = await setReportStatus(reportId, status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, status });
}
