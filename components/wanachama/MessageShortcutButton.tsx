"use client";

import { useRouter, usePathname } from "next/navigation";
import { withLocale } from "@/lib/i18n/href";
import { ChatIcon } from "@/components/icons";

// Deliberately its own client component rather than a LocaleLink with an
// inline onClick: MemberCard/MemberRow are Server Components, and a
// function prop (even a stopPropagation handler) can't cross a
// server-to-client boundary — the click handling has to live inside a
// client component instead of being passed into one.
export default function MessageShortcutButton({
  userId,
  className = "",
  ariaLabel,
}: {
  userId: string;
  className?: string;
  ariaLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(withLocale(pathname, `/ujumbe/${userId}`));
      }}
      aria-label={ariaLabel}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-blush-50 hover:text-primary ${className}`}
    >
      <ChatIcon className="h-4 w-4" />
    </button>
  );
}
