import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import PaymentForm from "@/components/PaymentForm";
import TierBadge from "@/components/TierBadge";

function formatTzs(amount: number) {
  return new Intl.NumberFormat("sw-TZ").format(amount);
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect(`/ingia`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { package: true },
  });

  if (!order || order.userId !== userId) redirect("/kuwa-mwanachama");
  if (order.status !== "PENDING") redirect("/akaunti");

  return (
    <div className="bg-mosque-pattern px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <TierBadge tier={order.package.tier} className="mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-navy">
            {order.package.name} Membership — Mwezi 1
          </h1>
          <p className="mt-1 text-2xl font-bold text-primary">{formatTzs(order.amountTzs)} TZS</p>
        </div>

        <PaymentForm orderId={order.id} amountTzs={order.amountTzs} />
      </div>
    </div>
  );
}
