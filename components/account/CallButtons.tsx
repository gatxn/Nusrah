"use client";

import { useState } from "react";
import { PhoneCallIcon, VideoIcon } from "@/components/icons";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export default function CallButtons({
  dict,
}: {
  dict: Pick<Dictionary["akaunti"], "voiceCallButton" | "videoCallButton"> &
    Pick<Dictionary["calls"], "networkError">;
}) {
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState<"voice" | "video" | null>(null);

  async function tryCall(kind: "voice" | "video") {
    setLoading(kind);
    setStatus(null);
    try {
      const res = await fetch(`/api/calls/${kind}`, { method: "POST" });
      const json = await res.json();
      setStatus({ type: res.ok ? "ok" : "error", text: json.message ?? json.error });
    } catch {
      setStatus({ type: "error", text: dict.networkError });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => tryCall("voice")}
          disabled={loading !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-blush-50 disabled:opacity-60"
        >
          <PhoneCallIcon className="h-4 w-4" /> {dict.voiceCallButton}
        </button>
        <button
          type="button"
          onClick={() => tryCall("video")}
          disabled={loading !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-blush-50 disabled:opacity-60"
        >
          <VideoIcon className="h-4 w-4" /> {dict.videoCallButton}
        </button>
      </div>
      {status && (
        <p className={`mt-2 text-xs ${status.type === "ok" ? "text-green-700" : "text-red-600"}`}>
          {status.text}
        </p>
      )}
    </div>
  );
}
