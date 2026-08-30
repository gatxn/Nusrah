"use client";

import { usePathname } from "next/navigation";
import LocaleLink from "@/components/LocaleLink";
import type { Dictionary } from "@/app/[locale]/dictionaries";

type NavLabels = Dictionary["common"]["nav"];

export default function NavLinks({
  className = "",
  variant = "desktop",
  loggedIn = false,
  unreadMessageCount = 0,
  labels,
}: {
  className?: string;
  variant?: "desktop" | "mobile";
  loggedIn?: boolean;
  unreadMessageCount?: number;
  labels: NavLabels;
}) {
  const pathname = usePathname();

  const loggedOutLinks = [
    { href: "/", label: labels.home },
    { href: "/jinsi-inavyofanyakazi", label: labels.howItWorks },
    { href: "/kuwa-mwanachama", label: labels.membership },
    { href: "/mafanikio", label: labels.successStories },
    { href: "/msaada", label: labels.help },
  ];

  // Signed-in members don't need the marketing pages (they've already joined)
  // or the homepage (it re-offers Ingia/Jiunge Sasa, which makes no sense once
  // signed in) — just the app itself plus the package-change entry point.
  const loggedInLinks = [
    { href: "/wanachama", label: labels.members },
    { href: "/ujumbe", label: labels.messages },
    { href: "/kuwa-mwanachama", label: labels.changePackage },
    { href: "/msaada", label: labels.help },
  ];

  const links = loggedIn ? loggedInLinks : loggedOutLinks;

  return (
    <nav className={className}>
      {links.map((link) => {
        const active = pathname === link.href;
        const desktopClass = active
          ? "flex items-center gap-1.5 border-b-2 border-primary pb-1 text-sm font-medium text-primary"
          : "flex items-center gap-1.5 pb-1 text-sm font-medium text-green-700 transition hover:text-primary";
        const mobileClass = active
          ? "flex items-center gap-1.5 rounded-lg bg-blush-50 px-3 py-2 text-sm font-medium text-primary"
          : "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-green-700 hover:bg-blush-50";
        const showBadge = link.href === "/ujumbe" && unreadMessageCount > 0;
        return (
          <LocaleLink key={link.href} href={link.href} className={variant === "mobile" ? mobileClass : desktopClass}>
            {link.label}
            {showBadge && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </span>
            )}
          </LocaleLink>
        );
      })}
    </nav>
  );
}
