import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import { getDictionary, getLocale } from "@/app/[locale]/dictionaries";
import { localeHref } from "@/lib/i18n/href";
import LocaleLink from "@/components/LocaleLink";
import PaymentForm from "@/components/PaymentForm";
import TierBadge from "@/components/TierBadge";

function formatTzs(amount: number) {
  return new Intl.NumberFormat("sw-TZ").format(amount);
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ paid?: string; cancelled?: string }>;
}) {
  const { orderId } = await params;
  const [{ paid, cancelled }, userId, locale, dict] = await Promise.all([
    searchParams,
    getSessionUserId(),
    getLocale(),
    getDictionary(),
  ]);
  if (!userId) redirect(localeHref(locale, "/ingia"));

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { package: true },
  });

  if (!order || order.userId !== userId) redirect(localeHref(locale, "/kuwa-mwanachama"));

  const t = dict.malipo;

  const statusBlock =
    order.status === "PAID"
      ? { heading: t.statusPaidHeading, body: t.statusPaidBody, cta: t.statusPaidCta, ctaHref: "/akaunti" }
      : order.status === "FAILED"
        ? { heading: t.statusCancelledHeading, body: t.statusCancelledBody, cta: t.statusCancelledCta, ctaHref: `/malipo/${order.id}` }
        : paid === "1"
          ? { heading: t.statusPendingHeading, body: t.statusPendingBody, cta: t.statusPendingCta, ctaHref: `/malipo/${order.id}` }
          : cancelled === "1"
            ? { heading: t.statusCancelledHeading, body: t.statusCancelledBody, cta: t.statusCancelledCta, ctaHref: `/malipo/${order.id}` }
            : null;

  return (
    <div className="bg-mosque-pattern px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <TierBadge tier={order.package.tier} className="mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-navy">
            {order.package.name} {t.membershipHeading}
          </h1>
          <p className="mt-1 text-2xl font-bold text-primary">{formatTzs(order.amountTzs)} TZS</p>
        </div>

        {statusBlock ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-navy">{statusBlock.heading}</h2>
            <p className="mt-2 text-sm text-neutral-600">{statusBlock.body}</p>
            <LocaleLink
              href={statusBlock.ctaHref}
              className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {statusBlock.cta}
            </LocaleLink>
          </div>
        ) : (
          <PaymentForm orderId={order.id} amountTzs={order.amountTzs} dict={t} />
        )}
      </div>
    </div>
  );
}
