import type { AdminOrderRow } from "@/lib/admin/orders";
import OrderConfirmActions from "@/components/admin/OrderConfirmActions";

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-600",
};

function formatTzs(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export default function AdminOrderTable({ orders, showActions = false }: { orders: AdminOrderRow[]; showActions?: boolean }) {
  if (orders.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-neutral-500">No orders to show.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Package</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Created</th>
            {showActions && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-3 font-medium text-navy">{o.userName}</td>
              <td className="px-4 py-3 text-neutral-600">{o.packageName}</td>
              <td className="px-4 py-3 text-neutral-600">{formatTzs(o.amountTzs)} TZS</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[o.status] ?? STATUS_STYLES.PENDING}`}>
                  {o.status}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-500">{formatDate(o.createdAt)}</td>
              {showActions && (
                <td className="px-4 py-3">
                  <OrderConfirmActions orderId={o.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
