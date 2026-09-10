"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type NotificationsContextValue = {
  unreadCount: number;
  unreadMessageCount: number;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// Returns null (not a thrown error) when there's no provider in the tree —
// unlike useCall(), this hook is also called from NotificationBell when it's
// rendered in Nav.tsx's marketing header, which has no provider mounted.
export function useNotifications(): NotificationsContextValue | null {
  return useContext(NotificationsContext);
}

const NOTIFICATIONS_POLL_MS = 15000;

export default function NotificationsProvider({
  initialUnreadCount,
  initialUnreadMessageCount,
  children,
}: {
  initialUnreadCount: number;
  initialUnreadMessageCount: number;
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [unreadMessageCount, setUnreadMessageCount] = useState(initialUnreadMessageCount);

  // No immediate poll on mount — the SSR-seeded initial values are already
  // fresh as of this navigation, so the first fetch only needs to happen a
  // full interval later.
  useEffect(() => {
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const json = await res.json();
        if (cancelled || !res.ok) return;
        setUnreadCount(json.unreadCount);
        setUnreadMessageCount(json.unreadMessageCount);
      } catch {
        // ignore — retried on the next tick
      }
    }, NOTIFICATIONS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return (
    <NotificationsContext.Provider value={{ unreadCount, unreadMessageCount, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}
