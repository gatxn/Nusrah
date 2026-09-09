"use client";

import { useCall, type CallType } from "@/components/calls/CallProvider";
import { PhoneCallIcon, VideoIcon } from "@/components/icons";

export default function CallButton({
  calleeId,
  calleeName,
  calleeHasPhoto,
  type,
  disabled,
  ariaLabel,
}: {
  calleeId: string;
  calleeName: string;
  calleeHasPhoto: boolean;
  type: CallType;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const { startCall } = useCall();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => startCall({ calleeId, calleeName, calleeHasPhoto, type })}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-neutral-600 transition hover:bg-blush-50 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
    >
      {type === "VIDEO" ? <VideoIcon className="h-4.5 w-4.5" /> : <PhoneCallIcon className="h-4.5 w-4.5" />}
    </button>
  );
}
