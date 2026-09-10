"use client";

import { usePathname } from "next/navigation";
import LocaleLink from "@/components/LocaleLink";
import { useNotifications } from "@/components/NotificationsProvider";

export default function SidebarNavItem({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href + "/");

  // Only the Ujumbe row's badge tracks unread messages — keyed on href
  // rather than assuming every badge is a message count, so this stays
  // correct if another row ever gets its own badge.
  const ctx = useNotifications();
  const displayBadge = href === "/ujumbe" && ctx ? ctx.unreadMessageCount : badge;

  return (
    <LocaleLink
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-blush-50 text-primary" : "text-green-700 hover:bg-blush-50 hover:text-primary"
      }`}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {!!displayBadge && displayBadge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
          {displayBadge > 9 ? "9+" : displayBadge}
        </span>
      )}
    </LocaleLink>
  );
}
