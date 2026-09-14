import Link from "next/link";
import { listAdminReviews } from "@/lib/admin/reviews";
import ReviewDeleteButton from "@/components/admin/ReviewDeleteButton";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function AdminReviewsPage() {
  const reviews = await listAdminReviews();
  const publishedCount = reviews.filter((r) => r.isPublished).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reviews</h1>
          <p className="mt-1 text-sm text-neutral-500">
            The Mafanikio (Success Stories) page always shows the {publishedCount} newest reviews — there is no
            separate publish step. Add a review to put it live; delete one to let the next-newest take its place.
          </p>
        </div>
        <Link
          href="/admin/content/reviews/new"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          New Review
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        {reviews.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">No reviews yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Body</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{r.city}</td>
                  <td className="px-4 py-3 text-neutral-600">{r.rating}/5</td>
                  <td className="max-w-xs truncate px-4 py-3 text-neutral-600">{r.body}</td>
                  <td className="px-4 py-3">
                    {r.isPublished ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Live
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-500">
                        Not shown
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/content/reviews/${r.id}/edit`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Edit
                      </Link>
                      <ReviewDeleteButton reviewId={r.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
