import Link from "next/link";
import LocaleLink from "@/components/LocaleLink";
import Logo from "@/components/Logo";
import NavLinks from "@/components/NavLinks";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import NotificationBell from "@/components/NotificationBell";
import { ArrowRightIcon } from "@/components/icons";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { hasPhoto } from "@/lib/onboarding";
import { getOwnProfile } from "@/lib/onboarding-server";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/app/[locale]/dictionaries";

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function AccountAvatar({ name, photo }: { name: string; photo: boolean }) {
  // Plain <img>, not next/image: /api/onboarding/photo is a private,
  // cookie-authenticated route. next/image's optimizer fetches the source
  // server-side without forwarding the browser's session cookie, so it gets
  // a 401 from the route and serves a broken 400 back to the client.
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/api/onboarding/photo" alt="" className="h-7 w-7 rounded-full object-cover" />
  ) : (
    <AvatarIllustration name={name} className="h-7 w-7 rounded-full" />
  );
}

export default async function Nav() {
  const [user, dict, locale] = await Promise.all([getSessionUser(), getDictionary(), getLocale()]);
  const [profile, unreadCount, unreadMessageCount] = await Promise.all([
    user ? getOwnProfile(user.id) : Promise.resolve(null),
    user
      ? prisma.notification.count({ where: { recipientUserId: user.id, isRead: false } })
      : Promise.resolve(0),
    user
      ? prisma.message.count({ where: { receiverId: user.id, isRead: false } })
      : Promise.resolve(0),
  ]);
  const photo = hasPhoto(profile);
  const nav = dict.common.nav;

  return (
    <header className="sticky top-0 z-50 border-b border-blush-200 bg-white/95 backdrop-blur">
      <input type="checkbox" id="nav-toggle" className="peer hidden" />

      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 md:justify-between">
        <div className="flex items-center gap-3">
          <label
            htmlFor="nav-toggle"
            aria-label="Fungua menyu"
            className="flex h-9 w-9 cursor-pointer flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span className="h-0.5 w-6 bg-navy" />
            <span className="h-0.5 w-6 bg-navy" />
            <span className="h-0.5 w-6 bg-navy" />
          </label>

          <Logo tagline={dict.common.tagline} />
        </div>

        <NavLinks
          className="hidden items-center gap-6 md:flex"
          loggedIn={!!user}
          unreadMessageCount={unreadMessageCount}
          labels={nav}
        />

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher currentLocale={locale} label={dict.common.languageSwitcher.label} />
          {user ? (
            <>
              <NotificationBell initialUnreadCount={unreadCount} />
              <Link
                href="/akaunti"
                className="flex items-center gap-2 rounded-full border-[1.5px] border-blush-200 py-1.5 ps-1.5 pe-4 text-sm font-semibold text-primary transition hover:bg-blush-50"
              >
                <AccountAvatar name={user.name} photo={photo} />
                {firstName(user.name)}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(198,42,88,0.28)] transition hover:brightness-[1.06]"
                  style={{ background: "linear-gradient(135deg,#e4416f,#c31f56)" }}
                >
                  {nav.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <LocaleLink
                href="/ingia"
                className="flex items-center gap-2 rounded-full border-[1.5px] border-blush-200 py-1.5 ps-1.5 pe-5 text-sm font-semibold text-primary transition hover:bg-blush-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blush-50">
                  <ArrowRightIcon className="h-4 w-4 rtl:rotate-180" />
                </span>
                {nav.login}
              </LocaleLink>
              <LocaleLink
                href="/jisajili"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(198,42,88,0.28)] transition hover:brightness-[1.06]"
                style={{ background: "linear-gradient(135deg,#e4416f,#c31f56)" }}
              >
                {nav.joinNow}
              </LocaleLink>
            </>
          )}
        </div>
      </div>

      <div className="hidden flex-col gap-1 border-t border-blush-200 bg-white px-4 py-3 peer-checked:flex md:hidden">
        <NavLinks
          className="flex flex-col gap-1"
          variant="mobile"
          loggedIn={!!user}
          unreadMessageCount={unreadMessageCount}
          labels={nav}
        />
        <div className="mt-3 px-3">
          <LanguageSwitcher currentLocale={locale} label={dict.common.languageSwitcher.label} />
        </div>
        <div className="mt-2 flex gap-2 px-3">
          {user ? (
            <>
              <Link href="/akaunti" className="flex flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-blush-200 py-2 ps-2 pe-4 text-sm font-semibold text-primary">
                <AccountAvatar name={user.name} photo={photo} />
                {firstName(user.name)}
              </Link>
              <form action={logoutAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#e4416f,#c31f56)" }}
                >
                  {nav.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <LocaleLink href="/ingia" className="flex-1 rounded-full border-[1.5px] border-blush-200 px-4 py-2 text-center text-sm font-semibold text-primary">
                {nav.login}
              </LocaleLink>
              <LocaleLink
                href="/jisajili"
                className="flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#e4416f,#c31f56)" }}
              >
                {nav.joinNow}
              </LocaleLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
