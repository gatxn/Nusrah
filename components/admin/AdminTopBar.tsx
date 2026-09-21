import AdminNotificationBell from "@/components/admin/AdminNotificationBell";
import GlobalSearchBox from "@/components/admin/GlobalSearchBox";

export default function AdminTopBar({ name, unreadAlerts }: { name: string; unreadAlerts: number }) {
  return (
    <header className="sticky top-0 z-30 border-b border-blush-200 bg-white/95 px-4 py-2.5 backdrop-blur sm:px-6 print:hidden">
      <div className="flex items-center gap-3">
        <label
          htmlFor="admin-sidebar-toggle"
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 lg:hidden"
        >
          <span className="h-0.5 w-5 bg-navy" />
          <span className="h-0.5 w-5 bg-navy" />
          <span className="h-0.5 w-5 bg-navy" />
        </label>

        <GlobalSearchBox />

        <div className="ms-auto flex items-center gap-2.5">
          <AdminNotificationBell initialUnreadCount={unreadAlerts} />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-navy">{name}</span>
        </div>
      </div>
    </header>
  );
}
