import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminReview } from "@/lib/admin/reviews";

const reviewSchema = z.object({
  name: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review data" }, { status: 400 });

  const review = await createAdminReview(parsed.data);
  return NextResponse.json({ id: review.id }, { status: 201 });
}
