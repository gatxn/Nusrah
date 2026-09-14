"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebarNavItem({
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

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? "bg-blush-50 text-primary" : "text-neutral-600 hover:bg-blush-50 hover:text-primary"
      }`}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {!!badge && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}
