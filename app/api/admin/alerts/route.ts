import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { queryAdminAlerts } from "@/lib/admin/alerts";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const result = await queryAdminAlerts();
  return NextResponse.json(result);
}
