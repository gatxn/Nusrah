import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { setUserSuspended } from "@/lib/admin/users";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { userId } = await params;
  const ok = await setUserSuspended(userId, true);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
