"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import CallOverlay from "@/components/calls/CallOverlay";
import type { Dictionary } from "@/app/[locale]/dictionaries";

export type CallType = "VOICE" | "VIDEO";
export type CallPhase = "outgoing" | "incoming" | "connecting" | "active" | "ending";
export type CallEndReason = "DECLINED" | "MISSED" | "ENDED";

export type CallState = {
  phase: CallPhase;
  callId: string;
  type: CallType;
  otherUserId: string;
  otherUserName: string;
  otherUserHasPhoto: boolean;
  endReason?: CallEndReason;
};

type CallContextValue = {
  startCall: (input: { calleeId: string; calleeName: string; calleeHasPhoto: boolean; type: CallType }) => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

// No WebSocket/SSE infra in this app (same constraint ThreadView's message
// polling already works within) — an incoming call is discovered the same
// way: short-interval polling. Faster than messages' 9s since a ring needs
// to feel closer to real-time.
const INCOMING_POLL_MS = 4000;
const STATUS_POLL_MS = 2500;

export default function CallProvider({
  children,
  dict,
}: {
  children: React.ReactNode;
  dict: Dictionary["calls"];
}) {
  const [call, setCall] = useState<CallState | null>(null);
  const callRef = useRef<CallState | null>(null);
  // Kept current every render (not mutated during render itself, which React
  // flags) so callbacks like startCall/acceptCall always see the latest
  // state without needing to be redeclared on every change.
  useEffect(() => {
    callRef.current = call;
  });

  // Incoming-call poll — paused whenever a call (of any phase) is already
  // being handled, since the backend already refuses a second concurrent
  // call for the same user anyway.
  useEffect(() => {
    if (call) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/calls/incoming");
        const json = await res.json();
        if (cancelled || !res.ok || !json.call || callRef.current) return;
        setCall({
          phase: "incoming",
          callId: json.call.id,
          type: json.call.type,
          otherUserId: json.call.callerId,
          otherUserName: json.call.callerName,
          otherUserHasPhoto: json.call.callerHasPhoto,
        });
      } catch {
        // ignore — retried on the next tick
      }
    }

    poll();
    const interval = window.setInterval(poll, INCOMING_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [call]);

  // Caller-side poll while RINGING — detects the callee's response.
  useEffect(() => {
    if (!call || call.phase !== "outgoing") return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/calls/${call.callId}`);
        const json = await res.json();
        if (cancelled || !res.ok) return;
        const status = json.call?.status;
        if (status === "ACCEPTED") {
          setCall((c) => (c && c.callId === call.callId ? { ...c, phase: "connecting" } : c));
        } else if (status === "DECLINED" || status === "MISSED" || status === "ENDED") {
          setCall((c) => (c && c.callId === call.callId ? { ...c, phase: "ending", endReason: status } : c));
        }
      } catch {
        // ignore — retried on the next tick
      }
    }, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [call]);

  // Poll while ACTIVE — detects the other side hanging up.
  useEffect(() => {
    if (!call || call.phase !== "active") return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/calls/${call.callId}`);
        const json = await res.json();
        if (cancelled || !res.ok) return;
        if (json.call?.status === "ENDED") {
          setCall((c) => (c && c.callId === call.callId ? { ...c, phase: "ending", endReason: "ENDED" } : c));
        }
      } catch {
        // ignore — retried on the next tick
      }
    }, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [call]);

  // Briefly show why the call ended, then clear the overlay.
  useEffect(() => {
    if (!call || call.phase !== "ending") return;
    const timeout = window.setTimeout(() => setCall(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [call]);

  const startCall = useCallback(
    async (input: { calleeId: string; calleeName: string; calleeHasPhoto: boolean; type: CallType }) => {
      if (callRef.current) return;
      try {
        const res = await fetch("/api/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ calleeId: input.calleeId, type: input.type }),
        });
        const json = await res.json();
        if (!res.ok) {
          window.alert(json.error ?? dict.genericError);
          return;
        }
        setCall({
          phase: "outgoing",
          callId: json.callId,
          type: input.type,
          otherUserId: input.calleeId,
          otherUserName: input.calleeName,
          otherUserHasPhoto: input.calleeHasPhoto,
        });
      } catch {
        window.alert(dict.networkError);
      }
    },
    [dict]
  );

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (!current || current.phase !== "incoming") return;
    try {
      const res = await fetch(`/api/calls/${current.callId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      if (!res.ok) {
        setCall(null);
        return;
      }
      setCall((c) => (c ? { ...c, phase: "connecting" } : c));
    } catch {
      setCall(null);
    }
  }, []);

  const declineCall = useCallback(async () => {
    const current = callRef.current;
    if (!current) return;
    try {
      await fetch(`/api/calls/${current.callId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DECLINE" }),
      });
    } catch {
      // ignore — the ring times out on its own either way
    }
    setCall(null);
  }, []);

  const endCall = useCallback(async () => {
    const current = callRef.current;
    if (!current) return;
    try {
      await fetch(`/api/calls/${current.callId}/end`, { method: "POST" });
    } catch {
      // ignore
    }
    setCall(null);
  }, []);

  const onConnected = useCallback(() => {
    setCall((c) => (c ? { ...c, phase: "active" } : c));
  }, []);

  return (
    <CallContext.Provider value={{ startCall }}>
      {children}
      {call && (
        <CallOverlay
          call={call}
          dict={dict}
          onAccept={acceptCall}
          onDecline={declineCall}
          onEnd={endCall}
          onConnected={onConnected}
        />
      )}
    </CallContext.Provider>
  );
}
