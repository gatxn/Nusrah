import { notFound } from "next/navigation";
import { getAdminReview } from "@/lib/admin/reviews";
import ReviewForm from "@/components/admin/ReviewForm";

export default async function AdminEditReviewPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const review = await getAdminReview(reviewId);
  if (!review) notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Edit Review</h1>
      <p className="mt-1 text-sm text-neutral-500">Editing {review.name}&apos;s review.</p>

      <div className="mt-6 max-w-2xl">
        <ReviewForm review={review} />
      </div>
    </div>
  );
}
