import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { rejectOrderManually } from "@/lib/admin/orders";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { orderId } = await params;
  const result = await rejectOrderManually(orderId);
  if (!result.ok) {
    const status = result.reason === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.reason }, { status });
  }

  return NextResponse.json({ ok: true });
}
