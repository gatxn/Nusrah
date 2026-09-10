"use client";

import { useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import { PhoneCallIcon, VideoIcon, HangUpIcon, MicIcon, MicOffIcon, CameraIcon } from "@/components/icons";
import type { CallState } from "@/components/calls/CallProvider";
import type { Dictionary } from "@/app/[locale]/dictionaries";

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Synthesized via Web Audio (no audio asset) — sidesteps binary-asset size
// and licensing concerns entirely. Dual-tone ringback pair, a telephony
// standard rather than any copyrighted melody.
function playRingback(ctx: AudioContext, startAt: number) {
  [440, 480].forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.12;
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + 2);
  });
}

// Two short bursts per cycle — a generic "ring-ring" cadence, not a copy of
// any real ringtone.
function playRingtone(ctx: AudioContext, startAt: number) {
  [0, 0.5].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 900;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt + offset);
    osc.stop(startAt + offset + 0.35);
  });
}

export default function CallOverlay({
  call,
  dict,
  onAccept,
  onDecline,
  onEnd,
  onConnected,
}: {
  call: CallState;
  dict: Dictionary["calls"];
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
  onConnected: () => void;
}) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const localVideoElRef = useRef<HTMLDivElement>(null);
  const remoteVideoElRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteVideoJoined, setRemoteVideoJoined] = useState(false);
  const [remoteAudioJoined, setRemoteAudioJoined] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);

  const isVideo = call.type === "VIDEO";
  // The video containers must be mounted (and their refs populated) BEFORE
  // join() runs, not just once phase is "active" — Agora's user-published
  // event and the local camera track can both become ready while still
  // "connecting", and .play() only works against an element that already
  // exists in the DOM. A slower device (mobile, weaker network) is exactly
  // what exposes this: it was previously very easy to miss the attach
  // window entirely and be left with a permanently blank video tile.
  const showVideoLayer = isVideo && (call.phase === "connecting" || call.phase === "active");

  // Join the Agora channel once the call reaches "connecting" — both sides
  // arrive here independently (caller once ACCEPTED is polled in, callee
  // right after tapping Accept), each fetching its own token/uid.
  useEffect(() => {
    if (call.phase !== "connecting") return;
    let cancelled = false;

    async function join() {
      try {
        const [{ default: AgoraRTC }, tokenRes] = await Promise.all([
          import("agora-rtc-sdk-ng"),
          fetch(`/api/calls/${call.callId}/token`),
        ]);
        const tokenJson = await tokenRes.json();
        if (!tokenRes.ok) throw new Error(tokenJson.error ?? "token request failed");
        if (cancelled) return;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video") {
            if (remoteVideoElRef.current) user.videoTrack?.play(remoteVideoElRef.current);
            setRemoteVideoJoined(true);
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
            setRemoteAudioJoined(true);
          }
        });
        client.on("user-unpublished", (_user: IAgoraRTCRemoteUser, mediaType) => {
          if (mediaType === "video") setRemoteVideoJoined(false);
        });
        client.on("user-left", () => {
          setRemoteVideoJoined(false);
          setRemoteAudioJoined(false);
        });

        await client.join(tokenJson.appId, tokenJson.channelName, tokenJson.token, tokenJson.uid);
        if (cancelled) {
          await client.leave();
          return;
        }

        // Audio and video are captured/published independently — a camera
        // failure (denied permission, hardware busy, etc.) on one device
        // must not silently take the whole call down; the call still
        // connects with audio, and the video tile shows a clear fallback
        // instead of a bare black box.
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioRef.current = audioTrack;

        let videoTrack: ICameraVideoTrack | null = null;
        if (call.type === "VIDEO") {
          try {
            videoTrack = await AgoraRTC.createCameraVideoTrack({
              encoderConfig: "480p_1",
              facingMode: "user",
            });
            localVideoRef.current = videoTrack;
            if (localVideoElRef.current) videoTrack.play(localVideoElRef.current);
          } catch {
            setCameraFailed(true);
          }
        }

        if (cancelled) {
          audioTrack.close();
          videoTrack?.close();
          await client.leave();
          return;
        }

        await client.publish(videoTrack ? [audioTrack, videoTrack] : [audioTrack]);
        onConnected();
      } catch {
        if (!cancelled) setJoinError(dict.genericError);
      }
    }

    join();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per call when it reaches "connecting"; onConnected/dict are stable
  }, [call.phase, call.callId]);

  // Ringtone: ringback while this side is "outgoing" (caller waiting),
  // ringtone while "incoming" (callee being rung). Stops immediately on any
  // other phase transition or unmount via the cleanup below. Known
  // limitation, not engineered around: the incoming side has no prior user
  // gesture in this tab (discovered purely by the background poll), so some
  // browsers' autoplay policy may keep the AudioContext suspended until the
  // user interacts with the page at least once.
  useEffect(() => {
    if (call.phase !== "outgoing" && call.phase !== "incoming") return;
    const AudioContextCtor =
      window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    let cancelled = false;
    const ctx = new AudioContextCtor();
    ctx.resume().catch(() => {});
    const cycleMs = call.phase === "outgoing" ? 6000 : 2500;
    const play = call.phase === "outgoing" ? playRingback : playRingtone;

    function tick() {
      if (cancelled) return;
      play(ctx, ctx.currentTime + 0.05);
    }
    tick();
    const interval = window.setInterval(tick, cycleMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      ctx.close().catch(() => {});
    };
  }, [call.phase]);

  // Duration ticker once active.
  useEffect(() => {
    if (call.phase !== "active") return;
    const start = Date.now();
    const interval = window.setInterval(() => setDurationSec(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(interval);
  }, [call.phase]);

  // Leave the channel and release local tracks whenever this overlay goes
  // away, regardless of which path (end/decline/error) got it there.
  useEffect(() => {
    return () => {
      localAudioRef.current?.close();
      localVideoRef.current?.close();
      clientRef.current?.leave().catch(() => {});
    };
  }, []);

  function toggleMute() {
    localAudioRef.current?.setEnabled(muted);
    setMuted((m) => !m);
  }

  function toggleCamera() {
    localVideoRef.current?.setEnabled(cameraOff);
    setCameraOff((c) => !c);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-navy/95 px-6 py-10 text-white backdrop-blur-sm">
      {/* Base video layer — mounted for the whole connecting+active span so
          the refs are always ready by the time a track needs to attach.
          Sits behind the phase-specific chrome below via z-index/absolute
          positioning, not by being unmounted. */}
      {showVideoLayer && (
        <div className="absolute inset-0">
          <div ref={remoteVideoElRef} className="h-full w-full overflow-hidden bg-black/40" />
          <div
            ref={localVideoElRef}
            className="absolute bottom-24 end-4 z-10 h-32 w-24 overflow-hidden rounded-xl border-2 border-white/40 bg-black/60"
          />
          {call.phase === "active" && !remoteVideoJoined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <AvatarIllustration name={call.otherUserName} className="h-20 w-20" />
            </div>
          )}
        </div>
      )}

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-between">
        {call.phase === "incoming" && (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <AvatarIllustration name={call.otherUserName} className="h-24 w-24" />
              <p className="text-xl font-bold">{call.otherUserName}</p>
              <p className="text-sm text-white/70">
                {isVideo ? dict.incomingVideoHeading : dict.incomingVoiceHeading}
              </p>
            </div>
            <div className="flex gap-6 pb-6">
              <button
                type="button"
                onClick={onDecline}
                aria-label={dict.decline}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 transition hover:bg-red-700"
              >
                <HangUpIcon className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={onAccept}
                aria-label={dict.accept}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 transition hover:bg-green-700"
              >
                {isVideo ? <VideoIcon className="h-7 w-7" /> : <PhoneCallIcon className="h-7 w-7" />}
              </button>
            </div>
          </>
        )}

        {call.phase === "outgoing" && (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <AvatarIllustration name={call.otherUserName} className="h-24 w-24" />
              <p className="text-xl font-bold">{call.otherUserName}</p>
              <p className="text-sm text-white/70">{dict.outgoingHeading}</p>
            </div>
            <button
              type="button"
              onClick={onEnd}
              aria-label={dict.cancel}
              className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 transition hover:bg-red-700"
            >
              <HangUpIcon className="h-7 w-7" />
            </button>
          </>
        )}

        {call.phase === "connecting" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-navy/60 px-6 py-8">
            <AvatarIllustration name={call.otherUserName} className="h-24 w-24" />
            <p className="text-xl font-bold">{call.otherUserName}</p>
            <p className="text-sm text-white/70">{dict.connecting}</p>
            {joinError && (
              <>
                <p className="text-sm text-red-300">{joinError}</p>
                <button
                  type="button"
                  onClick={onEnd}
                  className="mt-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold"
                >
                  {dict.cancel}
                </button>
              </>
            )}
          </div>
        )}

        {call.phase === "active" && (
          <>
            <div className="w-full rounded-full bg-navy/40 px-4 py-1.5 text-center">
              <p className="text-sm text-white/90">{formatDuration(durationSec)}</p>
            </div>

            {!isVideo && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <AvatarIllustration name={call.otherUserName} className="h-24 w-24" />
                <p className="text-xl font-bold">{call.otherUserName}</p>
                {!remoteAudioJoined && <p className="text-sm text-white/60">{dict.connecting}</p>}
              </div>
            )}
            {isVideo && <div className="flex-1" />}
            {isVideo && cameraFailed && (
              <p className="text-xs text-red-300">{dict.genericError}</p>
            )}

            <div className="flex gap-4 pb-6 pt-6">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? dict.unmute : dict.mute}
                aria-pressed={muted}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                  muted ? "bg-white text-navy" : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {muted ? <MicOffIcon className="h-6 w-6" /> : <MicIcon className="h-6 w-6" />}
              </button>
              {isVideo && !cameraFailed && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  aria-label={cameraOff ? dict.cameraOn : dict.cameraOff}
                  aria-pressed={cameraOff}
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                    cameraOff ? "bg-white text-navy" : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  <CameraIcon className="h-6 w-6" />
                </button>
              )}
              <button
                type="button"
                onClick={onEnd}
                aria-label={dict.endCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 transition hover:bg-red-700"
              >
                <HangUpIcon className="h-6 w-6" />
              </button>
            </div>
          </>
        )}

        {call.phase === "ending" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <p className="text-lg font-semibold">
              {call.endReason === "DECLINED"
                ? dict.callDeclined
                : call.endReason === "MISSED"
                  ? dict.callMissed
                  : dict.callEnded}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
