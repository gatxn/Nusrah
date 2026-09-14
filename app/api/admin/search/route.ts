import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { searchAdmin } from "@/lib/admin/search";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const q = request.nextUrl.searchParams.get("q") ?? "";
  const result = await searchAdmin(q);
  return NextResponse.json(result);
}
