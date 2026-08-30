import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, getActiveSubscription } from "@/lib/auth";
import { daysRemainingUntil, formatDateSw } from "@/lib/dates";
import { hasPhoto } from "@/lib/onboarding";
import { getOwnProfile } from "@/lib/onboarding-server";
import TierBadge from "@/components/TierBadge";
import DevActivatePanel from "@/components/account/DevActivatePanel";
import CallButtons from "@/components/account/CallButtons";
import { CheckIcon, ClockIcon, CameraIcon } from "@/components/icons";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string }>;
}) {
  const { activated } = await searchParams;
  const userId = await getSessionUserId();
  if (!userId) redirect("/ingia");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/ingia");

  const [subscription, profile] = await Promise.all([
    getActiveSubscription(userId),
    getOwnProfile(userId),
  ]);
  const lastOrder = await prisma.order.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { package: true },
  });

  const tier = subscription?.tier ?? "FREE";
  const daysRemaining = subscription ? daysRemainingUntil(subscription.expiryDate) : 0;

  return (
    <div className="bg-hero-photo">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-navy">Akaunti Yangu</h1>
        <p className="mt-1 text-sm text-neutral-600">Karibu, {user.name}</p>

        {activated === "1" && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckIcon className="h-4 w-4" /> Kifurushi chako kimewashwa.
          </p>
        )}

        {!hasPhoto(profile) && (
          <Link
            href="/onboarding/photo"
            className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-blush-50 px-4 py-3 text-sm text-primary-dark transition hover:bg-blush-100"
          >
            <span className="flex items-center gap-2">
              <CameraIcon className="h-4 w-4" /> Ongeza picha ya wasifu wako ili kuonekana zaidi
            </span>
            <span className="font-semibold">Ongeza Picha</span>
          </Link>
        )}

        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TierBadge tier={tier} />
              <span className="text-sm font-semibold text-neutral-700">
                {subscription ? "ACTIVE" : "FREE (bila muda wa mwisho)"}
              </span>
            </div>
            <Link href="/kuwa-mwanachama" className="text-sm font-semibold text-primary hover:underline">
              Badilisha Kifurushi
            </Link>
          </div>

          {subscription && (
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-black/5 pt-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-neutral-500">Muda wa Kifurushi</dt>
                <dd className="mt-1 font-semibold text-navy">Siku 30</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Tarehe ya Mwisho</dt>
                <dd className="mt-1 flex items-center gap-1 font-semibold text-navy">
                  <ClockIcon className="h-3.5 w-3.5" /> {formatDateSw(subscription.expiryDate)}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Siku Zilizobaki</dt>
                <dd className="mt-1 font-semibold text-navy">{daysRemaining}</dd>
              </div>
            </dl>
          )}

          {lastOrder && (
            <div className="mt-5 border-t border-black/5 pt-5 text-sm">
              <p className="text-neutral-500">Malipo ya Mwisho</p>
              <p className="mt-1 font-semibold text-navy">
                {lastOrder.package.name} —{" "}
                {lastOrder.status === "PAID"
                  ? "Malipo Yamethibitishwa"
                  : lastOrder.status === "PENDING"
                    ? "Inasubiri Malipo"
                    : "Malipo Hayajafanikiwa"}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-navy">Vinjari Wanachama</h2>
            <p className="mt-1 text-sm text-neutral-600">Tazama wanachama wanaolingana na wewe</p>
            <Link
              href="/wanachama"
              className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Nenda Wanachama
            </Link>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-navy">Simu (GOLD/PREMIUM)</h2>
            <p className="mt-1 text-sm text-neutral-600">Jaribu upatikanaji wa simu kulingana na kifurushi chako</p>
            <div className="mt-4">
              <CallButtons />
            </div>
          </div>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6">
            <DevActivatePanel userId={userId} />
          </div>
        )}
      </div>
    </div>
  );
}
