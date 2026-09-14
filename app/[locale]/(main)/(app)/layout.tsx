import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUserId, getEffectiveTier, clearSessionCookie } from "@/lib/auth";
import { getNextIncompleteStep, STEP_ROUTES, hasPhoto } from "@/lib/onboarding";
import { getOwnProfile } from "@/lib/onboarding-server";
import { touchLastActive } from "@/lib/profiles";
import { getLocale, getDictionary } from "@/app/[locale]/dictionaries";
import { localeHref } from "@/lib/i18n/href";
import Sidebar from "@/components/sidebar/Sidebar";
import TopBar from "@/components/sidebar/TopBar";
import InactivityLogout from "@/components/InactivityLogout";
import CallProvider from "@/components/calls/CallProvider";
import NotificationsProvider from "@/components/NotificationsProvider";

// Single centralized guard for the whole member app surface (Wasifu/Matches,
// Ujumbe, Akaunti, Dashibodi, Wasifu Wangu, Mipangilio, Ripoti Mtumiaji, and
// the Wamenipenda/Likes-You page) — replaces the same
// `if (!userId) redirect("/ingia")` that used to be duplicated per-page.
// Public/dual-audience pages (marketing, Msaada, Usalama, Malipo,
// Thibitisha) live in the sibling (marketing) group instead, unaffected by
// this gate — see (marketing)/layout.tsx.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [userId, locale] = await Promise.all([getSessionUserId(), getLocale()]);
  if (!userId) redirect(localeHref(locale, "/ingia"));

  // Re-checked fresh from the DB on every request, never trusted from the
  // session cookie — matches this project's existing "never trust a cached
  // tier/role claim" precedent (see getActiveSubscription's comment in
  // lib/auth.ts). An admin block takes effect on the very next page load,
  // not just the member's next login attempt.
  const sessionUser = await prisma.user.findUnique({ where: { id: userId }, select: { isSuspended: true } });
  if (!sessionUser || sessionUser.isSuspended) {
    await clearSessionCookie();
    redirect(localeHref(locale, "/ingia"));
  }

  const profile = await getOwnProfile(userId);
  const nextStep = getNextIncompleteStep(profile);
  if (nextStep) redirect(localeHref(locale, STEP_ROUTES[nextStep]));

  const [user, tier, unreadNotifications, unreadMessages, dict] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getEffectiveTier(userId),
    prisma.notification.count({ where: { recipientUserId: userId, isRead: false } }),
    prisma.message.count({ where: { receiverId: userId, isRead: false } }),
    getDictionary(),
    touchLastActive(userId),
  ]);

  const searchActionHref = localeHref(locale, "/wanachama");

  return (
    <NotificationsProvider initialUnreadCount={unreadNotifications} initialUnreadMessageCount={unreadMessages}>
      <CallProvider dict={dict.calls}>
        <div className="min-h-screen bg-hero-photo">
          <InactivityLogout />
          <Sidebar tier={tier} unreadMessageCount={unreadMessages} />
          <div className="lg:ps-64">
            <TopBar
              name={user?.name ?? ""}
              hasPhoto={hasPhoto(profile)}
              tier={tier}
              unreadNotifications={unreadNotifications}
              searchActionHref={searchActionHref}
            />
            <main>{children}</main>
          </div>
        </div>
      </CallProvider>
    </NotificationsProvider>
  );
}
