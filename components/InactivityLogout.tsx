"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";

const TIMEOUT_MS = 10 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;

// Mounted once in (app)/layout.tsx so it covers the whole authenticated app
// surface. Uses a hard redirect (not the router) after logout so no stale
// authenticated page ever lingers in the client Router Cache.
export default function InactivityLogout() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function logout() {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        window.location.href = withLocale(pathnameRef.current ?? "/", "/ingia?nimetoka=muda");
      }
    }

    function resetTimer() {
      clearTimeout(timer);
      timer = setTimeout(logout, TIMEOUT_MS);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return null;
}
