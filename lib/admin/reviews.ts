import type { Review } from "@prisma/client";
import { prisma } from "@/lib/db";

// The public Mafanikio page (app/[locale]/(main)/(marketing)/mafanikio/page.tsx)
// shows the newest PUBLISHED_COUNT reviews ordered by createdAt desc, with no
// separate status/published column — that query IS the publish mechanism.
// isPublished below mirrors it exactly so the admin list can show which rows
// are currently live, rather than leaving create/delete feeling mysterious.
const PUBLISHED_COUNT = 6;

export type AdminReviewRow = Review & { isPublished: boolean };

export async function listAdminReviews(): Promise<AdminReviewRow[]> {
  const reviews = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
  return reviews.map((r, i) => ({ ...r, isPublished: i < PUBLISHED_COUNT }));
}

export async function getAdminReview(reviewId: string): Promise<Review | null> {
  return prisma.review.findUnique({ where: { id: reviewId } });
}

export type ReviewInput = { name: string; city: string; rating: number; body: string };

// Admin-authored reviews are never tagged isSeed (that flag is reserved for
// the original launch seed data) and never carry a userId — there's no real
// member behind them, same as the existing seed rows.
export async function createAdminReview(input: ReviewInput): Promise<Review> {
  return prisma.review.create({ data: { ...input, isSeed: false } });
}

export async function updateAdminReview(reviewId: string, input: ReviewInput): Promise<boolean> {
  const result = await prisma.review.updateMany({ where: { id: reviewId }, data: input });
  return result.count === 1;
}

export async function deleteAdminReview(reviewId: string): Promise<boolean> {
  const result = await prisma.review.deleteMany({ where: { id: reviewId } });
  return result.count === 1;
}
