"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up from 0 to `end` once it scrolls into view (IntersectionObserver
 * + requestAnimationFrame, eased). Shows the final value immediately under
 * prefers-reduced-motion instead of animating.
 */
export default function CountUpNumber({
  end,
  suffix = "",
  duration = 1400,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(
    () => (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? end : 0)
  );
  const started = useRef(value === end);

  useEffect(() => {
    if (started.current) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        const startTime = performance.now();
        function tick(now: number) {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          setValue(Math.round(end * eased));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {new Intl.NumberFormat("sw-TZ").format(value)}
      {suffix}
    </span>
  );
}
