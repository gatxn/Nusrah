import Link from "next/link";
import { queryAdminOrders } from "@/lib/admin/orders";
import {
  confirmedRevenueTzs,
  confirmedRevenueUsdCents,
  confirmedRevenueByGateway,
  pendingUnconfirmedRevenueTzs,
  pendingOrderCount,
} from "@/lib/admin/revenue";
import AdminOrderTable from "@/components/admin/AdminOrderTable";
import AdminPagination from "@/components/admin/AdminPagination";
import RevenueStatCard from "@/components/admin/RevenueStatCard";
import { CreditCardIcon } from "@/components/icons";

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

  const [result, confirmed, confirmedUsdCents, pendingUnconfirmed, pendingCount, byGateway] = await Promise.all([
    queryAdminOrders({ page }),
    confirmedRevenueTzs(),
    confirmedRevenueUsdCents(),
    pendingUnconfirmedRevenueTzs(),
    pendingOrderCount(),
    confirmedRevenueByGateway(),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Payments</h1>
      <p className="mt-1 text-sm text-neutral-500">Every order ever created, most recent first.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <RevenueStatCard
          icon={<CreditCardIcon className="h-4.5 w-4.5" />}
          label="Confirmed Revenue (TZS)"
          value={`${formatTzs(confirmed)} TZS`}
          breakdown={byGateway}
        />
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-50 text-primary">
            <CreditCardIcon className="h-4.5 w-4.5" />
          </div>
          <p className="mt-3 text-xs font-medium text-neutral-500">Confirmed Revenue (PayPal)</p>
          <p className="mt-0.5 text-xl font-bold text-navy">${(confirmedUsdCents / 100).toFixed(2)}</p>
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
