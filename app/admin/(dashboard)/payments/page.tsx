import Link from "next/link";
import { queryAdminOrders } from "@/lib/admin/orders";
import { confirmedRevenueTzs, pendingUnconfirmedRevenueTzs, pendingOrderCount } from "@/lib/admin/revenue";
import AdminOrderTable from "@/components/admin/AdminOrderTable";
import AdminPagination from "@/components/admin/AdminPagination";

function formatTzs(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [result, confirmed, pendingUnconfirmed, pendingCount] = await Promise.all([
    queryAdminOrders({ page }),
    confirmedRevenueTzs(),
    pendingUnconfirmedRevenueTzs(),
    pendingOrderCount(),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Payments</h1>
      <p className="mt-1 text-sm text-neutral-500">Every order ever created, most recent first.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Confirmed Revenue</p>
          <p className="mt-1 text-2xl font-bold text-navy">{formatTzs(confirmed)} TZS</p>
          <p className="mt-1 text-xs text-neutral-500">Sum of orders with a real, verified payment.</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending / Unconfirmed</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{formatTzs(pendingUnconfirmed)} TZS</p>
          <p className="mt-1 text-xs text-amber-700">
            {pendingCount} order(s) stuck PENDING — money may have already been taken from the customer
            without our system knowing.{" "}
            <Link href="/admin/payments/pending" className="font-semibold underline">
              Review queue →
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        <AdminOrderTable orders={result.orders} />
        <AdminPagination
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          basePath="/admin/payments"
          searchParams={sp}
        />
      </div>
    </div>
  );
}
