"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/icons";

type AdminAlertView = {
  id: string;
  type: string;
  message: string;
  linkHref: string | null;
  isRead: boolean;
  createdAt: string;
};

// Simplified sibling of components/NotificationBell.tsx — no
// NotificationsProvider context, since the admin dashboard has no
// real-time cross-page unread state to share, just this one bell.
export default function AdminNotificationBell({ initialUnreadCount }: { initialUnreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [alerts, setAlerts] = useState<AdminAlertView[] | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (!next) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/alerts");
      const json = await res.json();
      if (res.ok) setAlerts(json.alerts);
      if (unreadCount > 0) {
        await fetch("/api/admin/alerts/read-all", { method: "PATCH" });
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-blush-50"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 max-w-[90vw] rounded-2xl border border-black/5 bg-white p-3 shadow-lg">
          <p className="mb-2 px-2 text-sm font-bold text-navy">Notifications</p>
          {loading && !alerts ? (
            <p className="px-2 py-4 text-center text-sm text-neutral-500">Loading…</p>
          ) : !alerts || alerts.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-neutral-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.linkHref ?? "#"}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 text-sm transition hover:bg-blush-50 ${
                      a.isRead ? "text-neutral-600" : "font-medium text-navy"
                    }`}
                  >
                    {a.message}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
