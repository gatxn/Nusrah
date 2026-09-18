import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { updatePackage } from "@/lib/admin/packages";

const updateSchema = z.object({
  priceTzs: z.number().int().min(0),
  priceUsdCents: z.number().int().min(0).nullable(),
  durationDays: z.number().int().min(1),
  tagline: z.string().min(1),
  features: z.array(z.string().min(1)),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ packageId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { packageId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid package data" }, { status: 400 });

  const updated = await updatePackage(packageId, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
