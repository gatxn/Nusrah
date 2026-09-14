import Link from "next/link";

export default function AdminPagination({
  page,
  pageSize,
  totalCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => !!v) as [string, string][]
    );
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-sm text-neutral-500">
      <span>
        Page {page} of {totalPages} ({totalCount} total)
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={hrefFor(page - 1)} className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-blush-50">
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link href={hrefFor(page + 1)} className="rounded-full border border-black/10 px-3 py-1.5 hover:bg-blush-50">
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
