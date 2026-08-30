"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ThreadMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  sentAt: string;
  isRead: boolean;
};

const POLL_INTERVAL_MS = 9000;

export default function ThreadView({
  viewerId,
  otherUserId,
  canSend,
  blockedReason,
  initialMessages,
}: {
  viewerId: string;
  otherUserId: string;
  canSend: boolean;
  blockedReason: string | null;
  initialMessages: ThreadMessage[];
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function markRead() {
    try {
      await fetch(`/api/messages/read/${otherUserId}`, { method: "PATCH" });
    } catch {
      // best-effort; the next poll or page load will retry
    }
  }

  async function pollThread() {
    try {
      const res = await fetch(`/api/messages?with=${otherUserId}`);
      const json = await res.json();
      if (res.ok) setMessages(json.messages);
    } catch {
      // ignore — will retry on the next tick
    }
    // Re-fired every tick, not just on mount: keeps unread state accurate if
    // the other party replies while this thread is already open. Idempotent
    // (a no-op updateMany when nothing is unread), so this is cheap.
    markRead();
  }

  useEffect(() => {
    markRead();
    const interval = window.setInterval(pollThread, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time setup; otherUserId is stable per mount
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;

    setError(null);
    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimistic: ThreadMessage = {
      id: tempId,
      senderId: viewerId,
      receiverId: otherUserId,
      body,
      sentAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: otherUserId, body }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(body);
        setError(json.error ?? "Hitilafu imetokea");
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === tempId ? json.message : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(body);
      setError("Imeshindwa kuunganisha na seva.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-500">
            Bado hakuna ujumbe. Anza mazungumzo hapa chini.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === viewerId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "bg-primary text-white" : "bg-blush-50 text-navy"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {canSend ? (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-black/5 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Andika ujumbe wako wa heshima..."
            className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Tuma
          </button>
        </form>
      ) : (
        <div className="border-t border-black/5 p-4 text-center">
          <p className="text-sm text-neutral-600">{blockedReason}</p>
          <Link href="/kuwa-mwanachama" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
            Badili Kifurushi
          </Link>
        </div>
      )}

      {error && <p className="border-t border-black/5 px-4 py-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
