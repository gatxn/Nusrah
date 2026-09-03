"use client";

import { useState } from "react";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export type BlockedUserRow = { blockedUserId: string; name: string };

export default function BlockedUsersList({
  initialBlocked,
  dict,
}: {
  initialBlocked: BlockedUserRow[];
  dict: Dictionary["mipangilio"]["blockedUsersList"];
}) {
  const [rows, setRows] = useState(initialBlocked);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function unblock(blockedUserId: string) {
    setPendingId(blockedUserId);
    try {
      const res = await fetch(`/api/blocks/${blockedUserId}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.blockedUserId !== blockedUserId));
      }
    } finally {
      setPendingId(null);
    }
  }

  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500">{dict.emptyState}</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li
          key={row.blockedUserId}
          className="flex items-center justify-between gap-3 rounded-xl border border-black/5 px-4 py-2.5"
        >
          <span className="text-sm font-medium text-navy">{row.name}</span>
          <button
            type="button"
            onClick={() => unblock(row.blockedUserId)}
            disabled={pendingId === row.blockedUserId}
            className="rounded-full border border-black/10 px-4 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-blush-50 disabled:opacity-60"
          >
            {pendingId === row.blockedUserId ? dict.unblocking : dict.unblock}
          </button>
        </li>
      ))}
    </ul>
  );
}
