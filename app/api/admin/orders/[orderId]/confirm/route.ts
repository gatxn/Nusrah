import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { confirmOrderManually } from "@/lib/admin/orders";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { admin, response } = await requireAdmin();
  if (response) return response;

  const { orderId } = await params;
  const result = await confirmOrderManually(orderId, admin.id);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true });
}
