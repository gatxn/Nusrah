import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// No analogous member-facing route exists for Report.evidenceEnc (unlike
// Profile.photoEnc) — evidence is only ever meant to be seen by whoever
// reviews the report, which today means admin only.
export async function GET(_request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { reportId } = await params;
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { evidenceEnc: true, evidenceMimeType: true },
  });
  if (!report?.evidenceEnc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(report.evidenceEnc), {
    headers: {
      "Content-Type": report.evidenceMimeType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
