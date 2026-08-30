import LocaleLink from "@/components/LocaleLink";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import { StarIcon, ArrowRightIcon } from "@/components/icons";
import { getDictionary } from "../../dictionaries";

export default async function SuccessStoriesPage() {
  const [reviews, loggedIn, dict] = await Promise.all([
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    getSessionUserId().then(Boolean),
    getDictionary(),
  ]);
  const t = dict.mafanikio;

  return (
    <div className="bg-hero-photo">
      <section className="px-4 py-14 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">{t.subtitle}</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <AvatarIllustration name={review.name} className="h-12 w-12" />
                <div>
                  <p className="font-semibold text-navy">{review.name}</p>
                  <p className="text-xs text-neutral-500">{review.city}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-0.5 text-tier-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className={`h-4 w-4 ${i < review.rating ? "opacity-100" : "opacity-20"}`} />
                ))}
              </div>
              <p className="mt-3 text-sm text-neutral-600">&ldquo;{review.body}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6">
          {t.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-white sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-white/60 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blush-50 px-4 py-14 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t.ctaHeading}</h2>
        <p className="mx-auto mt-3 max-w-lg text-neutral-600">
          {loggedIn ? t.ctaLoggedIn : t.ctaLoggedOut}
        </p>
        <LocaleLink
          href={loggedIn ? "/wanachama" : "/jisajili"}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          {loggedIn ? dict.home.ctaMembers : t.ctaButtonLoggedOut}
          <ArrowRightIcon className="h-4 w-4 rtl:rotate-180" />
        </LocaleLink>
      </section>
    </div>
  );
}
