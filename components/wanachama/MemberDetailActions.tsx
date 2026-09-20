"use client";

import { useState } from "react";
import { ChatIcon } from "@/components/icons";
import ReportUserModal from "@/components/wanachama/ReportUserModal";
import CallButton from "@/components/calls/CallButton";
import LocaleLink from "@/components/LocaleLink";
import { hasCapability, type Tier } from "@/lib/tiers";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function MemberDetailActions({
  userId,
  userName,
  userHasPhoto,
  viewerTier,
  dict,
  reportDict,
  reportReasons,
}: {
  userId: string;
  userName: string;
  userHasPhoto: boolean;
  viewerTier: Tier;
  dict: Dictionary["wanachama"]["detail"];
  reportDict: Dictionary["ripotiMtumiaji"]["modal"];
  reportReasons: Dictionary["common"]["reportReasons"];
}) {
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string; showUpgradeLink?: boolean } | null>(
    null
  );

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
        setStatus({
          type: "error",
          text: json.error ?? dict.genericError,
          showUpgradeLink: json.reason === "CANNOT_INITIATE" || json.reason === "CANNOT_REPLY",
        });
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
        <CallButton
          calleeId={userId}
          calleeName={userName}
          calleeHasPhoto={userHasPhoto}
          type="VOICE"
          disabled={!hasCapability(viewerTier, "canVoiceCall")}
          ariaLabel={dict.voiceCallAria}
        />
        <CallButton
          calleeId={userId}
          calleeName={userName}
          calleeHasPhoto={userHasPhoto}
          type="VIDEO"
          disabled={!hasCapability(viewerTier, "canVideoCall")}
          ariaLabel={dict.videoCallAria}
        />
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
          {status.text}{" "}
          {status.type === "ok" && (
            <>
              {"— "}
              <LocaleLink href={`/ujumbe/${userId}`} className="font-semibold text-primary hover:underline">
                {dict.goToMessages}
              </LocaleLink>
            </>
          )}
          {status.showUpgradeLink && (
            <LocaleLink href="/boresha-kifurushi" className="font-semibold text-primary hover:underline">
              {dict.upgradePlanLink}
            </LocaleLink>
          )}
        </p>
      )}
      <div className="mt-3">
        <ReportUserModal userId={userId} userName={userName} dict={reportDict} reasons={reportReasons} />
      </div>
    </div>
  );
}
