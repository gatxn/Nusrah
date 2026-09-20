import LocaleLink from "@/components/LocaleLink";
import { SparkleIcon, MedalIcon, CheckIcon, LockIcon, UsersIcon, MailIcon } from "@/components/icons";
import { getDictionary } from "../../../dictionaries";

export default async function AboutPage() {
  const dict = await getDictionary();
  const t = dict.kuhusu;

  return (
    <div className="bg-hero-photo px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">{t.subtitle}</p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl space-y-6">
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy">
            <SparkleIcon className="h-5 w-5 text-primary" />
            {t.ourStoryHeading}
          </h2>
          <p className="mt-3 leading-relaxed text-neutral-700">{t.ourStoryBody}</p>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy">
            <MedalIcon className="h-5 w-5 text-primary" />
            {t.ourMissionHeading}
          </h2>
          <p className="mt-3 leading-relaxed text-neutral-700">{t.ourMissionBody}</p>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy">
            <CheckIcon className="h-5 w-5 text-primary" />
            {t.whatWeStandForHeading}
          </h2>
          <ul className="mt-3 space-y-2">
            {t.whatWeStandForItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5 leading-relaxed text-neutral-700">
                <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy">
            <LockIcon className="h-5 w-5 text-primary" />
            {t.privacyHeading}
          </h2>
          <p className="mt-3 leading-relaxed text-neutral-700">{t.privacyBody}</p>
        </section>

        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy">
            <UsersIcon className="h-5 w-5 text-primary" />
            {t.teamHeading}
          </h2>
          <p className="mt-3 leading-relaxed text-neutral-700">{t.teamBody}</p>
        </section>

        <section className="rounded-2xl border border-blush-200 bg-blush-50 p-6 text-center shadow-sm sm:p-7">
          <h2 className="flex items-center justify-center gap-2.5 text-lg font-semibold text-navy">
            <MailIcon className="h-5 w-5 text-primary" />
            {t.contactHeading}
          </h2>
          <p className="mt-2 text-neutral-600">{t.contactBody}</p>
          <LocaleLink
            href="/msaada"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            {t.contactCta}
          </LocaleLink>
        </section>
      </div>
    </div>
  );
}
