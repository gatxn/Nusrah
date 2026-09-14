import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isVerificationStatus, setVerificationStatus } from "@/lib/admin/users";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { userId } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;
  if (!isVerificationStatus(status)) {
    return NextResponse.json({ error: "Invalid verification status" }, { status: 400 });
  }

  const updated = await setVerificationStatus(userId, status);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, status });
}
