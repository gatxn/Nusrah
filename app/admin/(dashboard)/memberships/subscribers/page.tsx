import Link from "next/link";
import { queryActiveSubscribers } from "@/lib/admin/subscribers";
import AdminSubscriberTable from "@/components/admin/AdminSubscriberTable";
import AdminPagination from "@/components/admin/AdminPagination";

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const result = await queryActiveSubscribers({ page });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Active Paid Members</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every member with a currently active, unexpired paid plan — {result.totalCount} total.
          </p>
        </div>
        <Link href="/admin/memberships" className="text-sm font-semibold text-primary hover:underline">
          ← Back to Memberships
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        <AdminSubscriberTable subscribers={result.subscribers} />
        <AdminPagination
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          basePath="/admin/memberships/subscribers"
          searchParams={sp}
        />
      </div>
    </div>
  );
}
