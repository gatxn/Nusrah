import ReviewForm from "@/components/admin/ReviewForm";

export default function AdminNewReviewPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">New Review</h1>
      <p className="mt-1 text-sm text-neutral-500">
        This will show up on the public Mafanikio page immediately if it lands among the newest reviews.
      </p>

      <div className="mt-6 max-w-2xl">
        <ReviewForm />
      </div>
    </div>
  );
}
