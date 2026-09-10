"use client";

import { useEffect, useRef, useState } from "react";
import LocaleLink from "@/components/LocaleLink";
import { BellIcon } from "@/components/icons";
import { useNotifications } from "@/components/NotificationsProvider";
import type { Dictionary } from "@/app/[locale]/dictionaries";

type NotificationView = {
  id: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  text: string;
  linkHref: string | null;
  sourceUserId: string | null;
};

export default function NotificationBell({
  initialUnreadCount,
  dict,
}: {
  initialUnreadCount: number;
  dict: Dictionary["common"]["topBar"]["notifications"];
}) {
  const ctx = useNotifications();
  const [open, setOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(initialUnreadCount);
  const unreadCount = ctx ? ctx.unreadCount : localUnreadCount;
  const [notifications, setNotifications] = useState<NotificationView[] | null>(null);
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
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (res.ok) setNotifications(json.notifications);
      if (unreadCount > 0) {
        await fetch("/api/notifications/read-all", { method: "PATCH" });
        if (ctx) ctx.markAllRead();
        else setLocalUnreadCount(0);
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
        aria-label={dict.bellAria}
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
          <p className="mb-2 px-2 text-sm font-bold text-navy">{dict.heading}</p>
          {loading && !notifications ? (
            <p className="px-2 py-4 text-center text-sm text-neutral-500">{dict.loading}</p>
          ) : !notifications || notifications.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-neutral-500">{dict.empty}</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <LocaleLink
                    href={n.linkHref ?? "#"}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 text-sm transition hover:bg-blush-50 ${
                      n.isRead ? "text-neutral-600" : "font-medium text-navy"
                    }`}
                  >
                    {n.text}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
