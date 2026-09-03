"use client";

import { useState } from "react";
import { ChatIcon } from "@/components/icons";
import FavoriteButton from "@/components/wanachama/FavoriteButton";
import ReportUserModal from "@/components/wanachama/ReportUserModal";
import LocaleLink from "@/components/LocaleLink";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function MemberDetailActions({
  userId,
  userName,
  initialFavorited,
  dict,
  cardLabels,
  reportDict,
  reportReasons,
}: {
  userId: string;
  userName: string;
  initialFavorited: boolean;
  dict: Dictionary["wanachama"]["detail"];
  cardLabels: Pick<Dictionary["wanachama"]["card"], "addFavoriteAria" | "removeFavoriteAria">;
  reportDict: Dictionary["ripotiMtumiaji"]["modal"];
  reportReasons: Dictionary["common"]["reportReasons"];
}) {
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function sendMessage() {
    if (!body.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId, body }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", text: json.error ?? dict.genericError });
        return;
      }
      setStatus({ type: "ok", text: dict.messageSent });
      setBody("");
      setComposing(false);
    } catch {
      setStatus({ type: "error", text: dict.networkError });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex gap-3">
        <FavoriteButton favoritedUserId={userId} initialFavorited={initialFavorited} labels={cardLabels} />
        {!composing && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <ChatIcon className="h-4 w-4" /> {dict.sendMessage}
          </button>
        )}
      </div>
      {composing && (
        <div className="mt-3 space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={dict.messagePlaceholder}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading}
              className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? dict.sending : dict.send}
            </button>
            <button
              type="button"
              onClick={() => setComposing(false)}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-neutral-600"
            >
              {dict.cancel}
            </button>
          </div>
        </div>
      )}
      {status && (
        <p className={`mt-2 text-xs ${status.type === "ok" ? "text-green-700" : "text-red-600"}`}>
          {status.text}
          {status.type === "ok" && (
            <>
              {" — "}
              <LocaleLink href={`/ujumbe/${userId}`} className="font-semibold text-primary hover:underline">
                {dict.goToMessages}
              </LocaleLink>
            </>
          )}
        </p>
      )}
      <div className="mt-3">
        <ReportUserModal userId={userId} userName={userName} dict={reportDict} reasons={reportReasons} />
      </div>
    </div>
  );
}
