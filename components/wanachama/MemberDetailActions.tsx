"use client";

import { useState } from "react";
import Link from "next/link";
import { ChatIcon } from "@/components/icons";
import FavoriteButton from "@/components/wanachama/FavoriteButton";
import ReportUserModal from "@/components/wanachama/ReportUserModal";

export default function MemberDetailActions({
  userId,
  userName,
  initialFavorited,
}: {
  userId: string;
  userName: string;
  initialFavorited: boolean;
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
        setStatus({ type: "error", text: json.error ?? "Hitilafu imetokea" });
        return;
      }
      setStatus({ type: "ok", text: "Ujumbe umetumwa" });
      setBody("");
      setComposing(false);
    } catch {
      setStatus({ type: "error", text: "Imeshindwa kuunganisha na seva." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex gap-3">
        <FavoriteButton favoritedUserId={userId} initialFavorited={initialFavorited} />
        {!composing && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <ChatIcon className="h-4 w-4" /> Tuma Ujumbe
          </button>
        )}
      </div>

      {composing && (
        <div className="mt-3 space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Andika ujumbe wako wa heshima..."
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading}
              className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Inatuma..." : "Tuma"}
            </button>
            <button
              type="button"
              onClick={() => setComposing(false)}
              className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-neutral-600"
            >
              Ghairi
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
              <Link href={`/ujumbe/${userId}`} className="font-semibold text-primary hover:underline">
                Nenda kwenye Ujumbe
              </Link>
            </>
          )}
        </p>
      )}

      <div className="mt-3">
        <ReportUserModal userId={userId} userName={userName} />
      </div>
    </div>
  );
}
