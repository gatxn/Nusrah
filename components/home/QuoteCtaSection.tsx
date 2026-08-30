import LocaleLink from "@/components/LocaleLink";
import { PersonPlusIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function QuoteCtaSection({
  loggedIn,
  dict,
}: {
  loggedIn: boolean;
  dict: Dictionary["home"];
}) {
  return (
    <section
      className="mx-4 my-6 grid gap-8 rounded-[20px] border border-blush-200 px-7 py-8 sm:mx-12 sm:px-9 lg:grid-cols-[1.55fr_1fr_0.95fr] lg:items-center"
      style={{ background: "linear-gradient(120deg,#fdf2f7,#f6eefb)" }}
    >
      <div className="flex gap-4">
        <span className="text-3xl leading-none text-blush-200" style={{ color: "#e8a6bf" }}>
          ❝
        </span>
        <div>
          {/* Always rendered RTL — this is Quranic Arabic script, a content
              choice independent of the page's own locale/direction. */}
          <p dir="rtl" className="mb-2.5 text-right text-[17px] leading-loose text-navy/90">
            {dict.quote.arabic}
          </p>
          <p className="text-[13px] leading-relaxed text-muted italic">{dict.quote.translation}</p>
        </div>
      </div>

      <div className="font-heading border-t border-blush-200 pt-6 text-base font-medium leading-snug text-navy lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
        {dict.quote.cta}
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <LocaleLink
          href={loggedIn ? "/wanachama" : "/jisajili"}
          className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-center text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(198,42,88,0.28)] transition hover:brightness-[1.06]"
          style={{ background: "linear-gradient(135deg,#e4416f,#c31f56)" }}
        >
          {!loggedIn && <PersonPlusIcon className="h-4.5 w-4.5" />}
          {loggedIn ? dict.ctaMembers : dict.ctaJoin}
        </LocaleLink>
        <p className="text-[12.5px] text-muted">{loggedIn ? dict.welcomeBackNote : dict.easySignupNote}</p>
      </div>
    </section>
  );
}
