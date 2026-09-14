import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { markAllAdminAlertsRead } from "@/lib/admin/alerts";

export async function PATCH() {
  const { response } = await requireAdmin();
  if (response) return response;

  await markAllAdminAlertsRead();
  return NextResponse.json({ ok: true });
}
