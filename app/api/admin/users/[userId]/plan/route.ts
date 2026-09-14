import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { setUserPlan, removeUserPlan } from "@/lib/admin/subscriptions";

const planSchema = z.object({ packageId: z.string().min(1) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { userId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan data" }, { status: 400 });

  const result = await setUserPlan(userId, parsed.data.packageId);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { userId } = await params;
  const result = await removeUserPlan(userId);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 404 });

  return NextResponse.json({ ok: true });
}
