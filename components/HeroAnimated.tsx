import LocaleLink from "@/components/LocaleLink";
import HeroVisual from "@/components/HeroVisual";
import { PersonPlusIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

/**
 * Hero section, ported from the approved Nusrah Landing design: arch-shaped
 * visual with floating hearts and sakura petals (pure CSS loops — see the
 * hero-float, hero-pulse-heart, and hero-petal classes in globals.css), a
 * pulsing heart glyph next to the headline, and the members trust-badge
 * cluster (now inside HeroVisual, alongside the interactive photo).
 */
export default function HeroAnimated({
  loggedIn,
  dict,
}: {
  loggedIn: boolean;
  dict: Dictionary["home"];
}) {
  return (
    <section className="relative grid items-center gap-14 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20">
      <div className="max-w-xl">
        <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-navy sm:text-5xl">
          {dict.headline1}
          <br />
          {dict.headline2} <span className="hero-pulse-heart text-3xl text-primary sm:text-4xl">♡</span>
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-muted">{dict.subtitle}</p>

        <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
          {dict.checklist.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-[15px] text-navy/90">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-[11px] text-white">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <LocaleLink
            href={loggedIn ? "/wanachama" : "/jisajili"}
            className="flex items-center gap-2 rounded-full px-7 py-4 text-[15.5px] font-semibold text-white shadow-[0_14px_30px_rgba(198,42,88,0.3)] transition hover:brightness-[1.06]"
            style={{ background: "linear-gradient(135deg,#e4416f,#c31f56)" }}
          >
            {!loggedIn && <PersonPlusIcon className="h-4.5 w-4.5" />}
            {loggedIn ? dict.ctaMembers : dict.ctaJoin}
          </LocaleLink>
          <LocaleLink
            href="/jinsi-inavyofanyakazi"
            className="flex items-center gap-2.5 rounded-full border-[1.5px] border-blush-200 bg-white px-6 py-3.5 text-[15.5px] font-semibold text-navy transition hover:border-primary"
          >
            <span className="flex h-6.5 w-6.5 items-center justify-center rounded-full border-[1.5px] border-muted/50 text-[10px] text-muted">
              ▶
            </span>
            {dict.ctaLearnMore}
          </LocaleLink>
        </div>

        <p className="mt-5 flex items-center gap-2 text-sm text-muted">
          <span className="text-primary">⛨</span> {dict.statsLinePrefix}{" "}
          <strong className="text-primary-dark">35,000+</strong>{" "}
          <span className="text-blush-200">|</span> {dict.statsLineMiddle}{" "}
          <strong className="text-primary-dark">2,000+</strong>
        </p>
      </div>

      <div className="relative">
        <HeroVisual
          photoAlt={dict.heroPhotoAlt}
          trustBadgeTitle={dict.trustBadgeTitle}
          trustBadgeSubtitle={dict.trustBadgeSubtitle}
        />

        {/* Floating hearts, drifting up from behind the arch */}
        <div className="pointer-events-none absolute bottom-[34%] left-1/2 h-0 w-0" aria-hidden="true">
          <span className="hero-float-a absolute text-2xl">💖</span>
          <span className="hero-float-b absolute text-xl" style={{ animationDelay: ".9s" }}>❤️</span>
          <span className="hero-float-c absolute text-3xl" style={{ animationDelay: "1.8s" }}>💕</span>
          <span className="hero-float-a absolute text-lg" style={{ animationDelay: "2.6s" }}>💗</span>
          <span className="hero-float-b absolute text-2xl" style={{ animationDelay: "3.4s" }}>💖</span>
          <span className="hero-float-c absolute text-base" style={{ animationDelay: "4.3s" }}>❤️</span>
          <span className="hero-float-a absolute text-xl" style={{ animationDelay: "5.1s" }}>💞</span>
          <span className="hero-float-b absolute text-sm" style={{ animationDelay: "5.8s" }}>💕</span>
        </div>

        {/* Falling sakura petals along the leading edge */}
        <div className="pointer-events-none absolute start-[-18px] top-10 h-[200px] w-[60px] overflow-hidden" aria-hidden="true">
          <span className="hero-petal absolute start-3 text-sm text-primary-light">🌸</span>
          <span className="hero-petal absolute start-7 text-xs text-primary-light" style={{ animationDelay: "3s" }}>🌸</span>
        </div>
      </div>
    </section>
  );
}
