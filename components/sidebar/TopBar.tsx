import NotificationBell from "@/components/NotificationBell";
import TopBarAccountMenu from "@/components/sidebar/TopBarAccountMenu";
import TopBarSearch from "@/components/sidebar/TopBarSearch";
import { getDictionary } from "@/app/[locale]/dictionaries";
import type { Tier } from "@/lib/tiers";

export default async function TopBar({
  name,
  hasPhoto,
  tier,
  unreadNotifications,
  searchActionHref,
}: {
  name: string;
  hasPhoto: boolean;
  tier: Tier;
  unreadNotifications: number;
  searchActionHref: string;
}) {
  const dict = await getDictionary();
  const t = dict.common;

  return (
    <header className="sticky top-0 z-30 border-b border-blush-200 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        {/* Targets the checkbox rendered in Sidebar.tsx — a <label htmlFor>
            works across the whole document, not just siblings, so the
            drawer's open/close state stays in Sidebar.tsx while the trigger
            lives here in the always-visible header. */}
        <label
          htmlFor="sidebar-toggle"
          aria-label={t.sidebar.openMenuAria}
          className="flex h-9 w-9 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span className="h-0.5 w-5 bg-navy" />
          <span className="h-0.5 w-5 bg-navy" />
          <span className="h-0.5 w-5 bg-navy" />
        </label>

        <TopBarSearch searchActionHref={searchActionHref} placeholder={t.topBar.searchPlaceholder} />

        <div className="ms-auto flex items-center gap-2.5">
          <NotificationBell initialUnreadCount={unreadNotifications} dict={t.topBar.notifications} />
          <TopBarAccountMenu name={name} hasPhoto={hasPhoto} tier={tier} dict={t.topBar.accountMenu} tiers={t.tiers} />
        </div>
      </div>
    </header>
  );
}
