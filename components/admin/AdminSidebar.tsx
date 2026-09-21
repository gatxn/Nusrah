import Link from "next/link";
import AdminSidebarNavItem from "@/components/admin/AdminSidebarNavItem";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import type { AdminAttentionCounts } from "@/lib/admin/attention";
import {
  GridIcon,
  UsersIcon,
  ShieldCheckIcon,
  HeartFilledIcon,
  FlagIcon,
  MedalIcon,
  CreditCardIcon,
  DocumentIcon,
  ListIcon,
  GearIcon,
  ArrowRightIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: (a: AdminAttentionCounts) => number;
};

// Mirrors the mockup's sidebar order exactly. Routes beyond /admin/dashboard
// don't exist yet as of Phase 1 — they're built out over the plan's later
// phases; visiting one early just 404s, which is an honest state for
// "phase 1 of a phased build," not a bug.
//
// badge is a live count of what needs a look in that section — see
// lib/admin/attention.ts. Payments' badge counts orders stuck PENDING past
// the same threshold the /admin/payments/pending queue uses.
const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/verification", label: "Profiles & Verification", icon: ShieldCheckIcon, badge: (a) => a.pendingVerification },
  { href: "/admin/matches", label: "Matches", icon: HeartFilledIcon },
  { href: "/admin/reports", label: "Messages/Reports", icon: FlagIcon, badge: (a) => a.pendingReports },
  { href: "/admin/memberships", label: "Memberships", icon: MedalIcon },
  { href: "/admin/payments", label: "Payments", icon: CreditCardIcon, badge: (a) => a.pendingPayments },
  { href: "/admin/content/reviews", label: "Content Management", icon: DocumentIcon },
  { href: "/admin/system-report", label: "System Report", icon: ListIcon },
];

export default function AdminSidebar({ attention }: { attention: AdminAttentionCounts }) {
  const content = (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-2 pt-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <span className="font-heading text-xl font-bold tracking-tight text-navy">Nusrah</span>
          <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] font-semibold text-white">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {NAV_ITEMS.map((item) => (
          <AdminSidebarNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon className="h-5 w-5 shrink-0 text-primary" />}
            badge={item.badge?.(attention)}
          />
        ))}
      </nav>

      <div className="space-y-1 border-t border-blush-100 p-3">
        <AdminSidebarNavItem
          href="/admin/settings"
          label="Settings"
          icon={<GearIcon className="h-5 w-5 shrink-0 text-primary" />}
        />
        <AdminLogoutButton icon={<ArrowRightIcon className="h-4.5 w-4.5 rotate-180" />} />
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e border-blush-200 bg-white lg:block print:hidden">
        {content}
      </aside>

      <div className="lg:hidden print:hidden">
        <input type="checkbox" id="admin-sidebar-toggle" className="peer hidden" />
        <label
          htmlFor="admin-sidebar-toggle"
          className="fixed inset-0 z-40 hidden bg-black/40 peer-checked:block"
          aria-hidden="true"
        />
        <aside className="fixed inset-y-0 start-0 z-50 w-64 -translate-x-full bg-white shadow-xl transition-transform duration-200 peer-checked:translate-x-0">
          {content}
        </aside>
      </div>
    </>
  );
}
