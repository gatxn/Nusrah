import { queryAdminOrders } from "@/lib/admin/orders";
import AdminOrderTable from "@/components/admin/AdminOrderTable";
import AdminPagination from "@/components/admin/AdminPagination";

// The unified "Membership Approvals" + "Payment Confirmations" queue from
// the mockup — there's no separate approval-workflow concept in this
// system, and a stuck-PENDING order IS what both of those really mean
// here, given the gateway confirmation history documented in
// lib/admin/revenue.ts.
export default async function AdminPaymentsPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const result = await queryAdminOrders({ page, pendingOnly: true });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Pending Payments</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {result.totalCount} order(s) stuck PENDING for over an hour, oldest first. Only confirm a payment
        if you have real proof it happened (an SMS confirmation, a receipt) — this immediately activates
        the member&apos;s subscription.
      </p>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white shadow-sm">
        <AdminOrderTable orders={result.orders} showActions />
        <AdminPagination
          page={result.page}
          pageSize={result.pageSize}
          totalCount={result.totalCount}
          basePath="/admin/payments/pending"
          searchParams={sp}
        />
      </div>
    </div>
  );
}
