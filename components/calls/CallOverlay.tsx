"use client";

import { useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import AvatarIllustration from "@/components/illustrations/AvatarIllustration";
import { PhoneCallIcon, VideoIcon, CloseIcon, MicIcon, MicOffIcon, CameraIcon } from "@/components/icons";
import type { CallState } from "@/components/calls/CallProvider";
import type { Dictionary } from "@/app/[locale]/dictionaries";

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
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
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [durationSec, setDurationSec] = useState(0);
  const [joinError, setJoinError] = useState<string | null>(null);

  const isVideo = call.type === "VIDEO";

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
          if (mediaType === "video" && remoteVideoElRef.current) {
            user.videoTrack?.play(remoteVideoElRef.current);
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
          setRemoteJoined(true);
        });
        client.on("user-left", () => setRemoteJoined(false));

        await client.join(tokenJson.appId, tokenJson.channelName, tokenJson.token, tokenJson.uid);
        if (cancelled) {
          await client.leave();
          return;
        }

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioRef.current = audioTrack;

        let videoTrack: ICameraVideoTrack | null = null;
        if (call.type === "VIDEO") {
          videoTrack = await AgoraRTC.createCameraVideoTrack();
          localVideoRef.current = videoTrack;
          if (localVideoElRef.current) videoTrack.play(localVideoElRef.current);
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
      {call.phase === "incoming" && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <AvatarIllustration name={call.otherUserName} className="h-24 w-24" />
            <p className="text-xl font-bold">{call.otherUserName}</p>
            <p className="text-sm text-white/70">{isVideo ? dict.incomingVideoHeading : dict.incomingVoiceHeading}</p>
          </div>
          <div className="flex gap-6 pb-6">
            <button
              type="button"
              onClick={onDecline}
              aria-label={dict.decline}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 transition hover:bg-red-700"
            >
              <CloseIcon className="h-7 w-7" />
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
            <CloseIcon className="h-7 w-7" />
          </button>
        </>
      )}

      {call.phase === "connecting" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
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
          <div className="w-full text-center">
            <p className="text-sm text-white/70">{formatDuration(durationSec)}</p>
          </div>

          {isVideo ? (
            <div className="relative w-full flex-1">
              <div ref={remoteVideoElRef} className="h-full w-full overflow-hidden rounded-2xl bg-black/40">
                {!remoteJoined && (
                  <div className="flex h-full w-full items-center justify-center">
                    <AvatarIllustration name={call.otherUserName} className="h-20 w-20" />
                  </div>
                )}
              </div>
              <div
                ref={localVideoElRef}
                className="absolute bottom-3 end-3 h-32 w-24 overflow-hidden rounded-xl border-2 border-white/40 bg-black/60"
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <AvatarIllustration name={call.otherUserName} className="h-24 w-24" />
              <p className="text-xl font-bold">{call.otherUserName}</p>
            </div>
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
            {isVideo && (
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
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </>
      )}

      {call.phase === "ending" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <p className="text-lg font-semibold">
            {call.endReason === "DECLINED" ? dict.callDeclined : call.endReason === "MISSED" ? dict.callMissed : dict.callEnded}
          </p>
        </div>
      )}
    </div>
  );
}
