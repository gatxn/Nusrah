"use client";

import { useEffect, useRef, useState } from "react";
import LocaleLink from "@/components/LocaleLink";
import type { Dictionary } from "@/app/[locale]/dictionaries";

type ThreadMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string | null;
  sentAt: string;
  isRead: boolean;
  editedAt: string | null;
  isDeleted: boolean;
};

const POLL_INTERVAL_MS = 9000;

export default function ThreadView({
  viewerId,
  otherUserId,
  canSend,
  blockedReason,
  initialMessages,
  dict,
}: {
  viewerId: string;
  otherUserId: string;
  canSend: boolean;
  blockedReason: string | null;
  initialMessages: ThreadMessage[];
  dict: Dictionary["ujumbe"]["thread"];
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Own-message actions (Edit/Delete) — keyed by message id, one at a time.
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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
      editedAt: null,
      isDeleted: false,
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
        setError(json.error ?? dict.genericError);
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...json.message, editedAt: null, isDeleted: false } : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(body);
      setError(dict.networkError);
    } finally {
      setSending(false);
    }
  }

  function openActions(messageId: string) {
    setConfirmDeleteId(null);
    setActiveMenuId((prev) => (prev === messageId ? null : messageId));
  }

  function startEdit(message: ThreadMessage) {
    setActiveMenuId(null);
    setConfirmDeleteId(null);
    setEditingId(message.id);
    setEditDraft(message.body ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function saveEdit(messageId: string) {
    const body = editDraft.trim();
    if (!body || editSaving) return;
    setEditSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? dict.genericError);
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, body: json.message.body, editedAt: json.message.editedAt } : m))
      );
      setEditingId(null);
    } catch {
      setError(dict.networkError);
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDelete(messageId: string) {
    setDeletingId(messageId);
    setError(null);
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? dict.genericError);
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, body: null } : m)));
    } catch {
      setError(dict.networkError);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
      setActiveMenuId(null);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-500">{dict.emptyThread}</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === viewerId;
            const isEditing = editingId === m.id;

            if (m.isDeleted) {
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[75%] rounded-2xl border border-dashed border-black/10 bg-transparent px-4 py-2.5 text-sm italic text-neutral-400">
                    {dict.messageDeleted}
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                {isEditing ? (
                  <div className="w-[75%] min-w-[220px] rounded-2xl border border-primary/30 bg-white p-2.5 shadow-sm">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-black/10 px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
                    />
                    <div className="mt-1.5 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={editSaving}
                        className="text-xs font-semibold text-neutral-500 hover:underline disabled:opacity-60"
                      >
                        {dict.cancelAction}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(m.id)}
                        disabled={editSaving || !editDraft.trim()}
                        className="text-xs font-semibold text-primary hover:underline disabled:opacity-60"
                      >
                        {editSaving ? "..." : dict.saveAction}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-1">
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        mine ? "bg-primary text-white" : "bg-blush-50 text-navy"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      {m.editedAt && (
                        <span className={`mt-0.5 block text-[10px] ${mine ? "text-white/70" : "text-neutral-400"}`}>
                          {dict.edited}
                        </span>
                      )}
                    </div>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => openActions(m.id)}
                        aria-label={dict.messageOptionsAria}
                        className="shrink-0 rounded-full px-1.5 py-1 text-neutral-300 hover:text-neutral-500"
                      >
                        •••
                      </button>
                    )}
                  </div>
                )}

                {mine && activeMenuId === m.id && !isEditing && (
                  <div className="mt-1 flex items-center gap-3 px-1">
                    {confirmDeleteId === m.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => confirmDelete(m.id)}
                          disabled={deletingId === m.id}
                          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
                        >
                          {deletingId === m.id ? "..." : dict.confirmDeleteAction}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deletingId === m.id}
                          className="text-xs font-semibold text-neutral-500 hover:underline disabled:opacity-60"
                        >
                          {dict.cancelAction}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(m)}
                          className="text-xs font-semibold text-neutral-500 hover:underline"
                        >
                          {dict.editAction}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(m.id)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          {dict.deleteAction}
                        </button>
                      </>
                    )}
                  </div>
                )}
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
            placeholder={dict.messagePlaceholder}
            className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {dict.send}
          </button>
        </form>
      ) : (
        <div className="border-t border-black/5 p-4 text-center">
          <p className="text-sm text-neutral-600">{blockedReason}</p>
          <LocaleLink href="/boresha-kifurushi" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
            {dict.upgradePackage}
          </LocaleLink>
        </div>
      )}

      {error && <p className="border-t border-black/5 px-4 py-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
