import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { updateAdminReview, deleteAdminReview } from "@/lib/admin/reviews";

const reviewSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(1000),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { reviewId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review data" }, { status: 400 });

  const updated = await updateAdminReview(reviewId, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { reviewId } = await params;
  const deleted = await deleteAdminReview(reviewId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
