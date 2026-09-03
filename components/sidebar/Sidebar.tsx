import Image from "next/image";
import LocaleLink from "@/components/LocaleLink";
import SidebarNavItem from "@/components/sidebar/SidebarNavItem";
import UpgradeCard from "@/components/sidebar/UpgradeCard";
import { logoutAction } from "@/lib/actions";
import { getDictionary, type Dictionary } from "@/app/[locale]/dictionaries";
import type { Tier } from "@/lib/tiers";
import {
  GridIcon,
  UsersIcon,
  ChatIcon,
  HeartFilledIcon,
  PersonIcon,
  GearIcon,
  ShieldCheckIcon,
  FlagIcon,
  HeadsetIcon,
  QuestionMarkIcon,
  ArrowRightIcon,
} from "@/components/icons";

type NavRow = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number };

// Exact 11-item order from the approved spec, split into 3 groups by
// separator + the upgrade card at the bottom.
function buildGroups(t: Dictionary["common"]["sidebar"], unreadMessageCount: number): NavRow[][] {
  return [
    [
      { href: "/dashibodi", label: t.dashibodi, icon: GridIcon },
      { href: "/wanachama", label: t.wasifu, icon: UsersIcon },
      { href: "/ujumbe", label: t.ujumbe, icon: ChatIcon, badge: unreadMessageCount },
      { href: "/wanachama/wamenipenda", label: t.wamenipenda, icon: HeartFilledIcon },
    ],
    [
      { href: "/wasifu-wangu", label: t.wasifuWangu, icon: PersonIcon },
      { href: "/mipangilio", label: t.mipangilio, icon: GearIcon },
    ],
    [
      { href: "/kituo-cha-usalama", label: t.kituoChaUsalama, icon: ShieldCheckIcon },
      { href: "/ripoti-mtumiaji", label: t.ripotiMtumiaji, icon: FlagIcon },
      { href: "/wasiliana-na-msaada", label: t.wasilianaNaMsaada, icon: HeadsetIcon },
      { href: "/maswali", label: t.maswali, icon: QuestionMarkIcon },
    ],
  ];
}

export default async function Sidebar({
  tier,
  unreadMessageCount,
}: {
  tier: Tier;
  unreadMessageCount: number;
}) {
  const dict = await getDictionary();
  const t = dict.common.sidebar;
  const groups = buildGroups(t, unreadMessageCount);

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-5">
        <LocaleLink href="/wanachama" className="flex items-center gap-2.5">
          <Image
            src="/images/nusrah-logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <span className="font-heading text-xl font-bold tracking-tight text-navy">Nusrah</span>
        </LocaleLink>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {groups.map((group, i) => (
          <div key={i} className="space-y-1 border-t border-blush-100 pt-3 first:border-t-0 first:pt-0">
            {group.map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<item.icon className="h-5 w-5 shrink-0 text-primary" />}
                badge={item.badge}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-blush-100 p-3">
        <UpgradeCard tier={tier} />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-500 transition hover:bg-blush-50 hover:text-primary"
          >
            <ArrowRightIcon className="h-4.5 w-4.5 rotate-180" />
            {t.logout}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e border-blush-200 bg-white lg:block">
        {content}
      </aside>

      {/* Mobile: zero-JS off-canvas drawer, same checkbox/peer convention as
          Nav.tsx. The checkbox lives here but its trigger button lives in
          TopBar.tsx instead (a <label htmlFor> targets a checkbox anywhere
          in the document, not just siblings) — a fixed bottom-corner button
          was easy to miss on real phones and collided with the Next.js dev
          indicator in local development, so the trigger now sits in the
          always-visible top header instead, matching Nav.tsx's placement. */}
      <div className="lg:hidden">
        <input type="checkbox" id="sidebar-toggle" className="peer hidden" />
        <label
          htmlFor="sidebar-toggle"
          className="fixed inset-0 z-40 hidden bg-black/40 peer-checked:block"
          aria-hidden="true"
        />
        <aside className="fixed inset-y-0 start-0 z-50 w-64 -translate-x-full bg-white shadow-xl transition-transform duration-200 peer-checked:translate-x-0 rtl:translate-x-full rtl:peer-checked:translate-x-0">
          {content}
        </aside>
      </div>
    </>
  );
}
