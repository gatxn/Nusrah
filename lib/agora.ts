import { RtcRole, RtcTokenBuilder } from "agora-token";

// Token is only ever handed out once a call is ACCEPTED (see
// app/api/calls/[callId]/token/route.ts) — a real call never legitimately
// runs anywhere close to this long, so it's simply a hard ceiling, not a
// value either party is expected to approach.
const TOKEN_TTL_SECONDS = 60 * 60;

export function isAgoraConfigured(): boolean {
  return Boolean(process.env.AGORA_APP_ID && process.env.AGORA_APP_CERTIFICATE);
}

export function getAgoraAppId(): string {
  const appId = process.env.AGORA_APP_ID;
  if (!appId) throw new Error("AGORA_APP_ID is not set");
  return appId;
}

/**
 * uid only needs to be unique WITHIN one call's channel, not globally — each
 * call gets its own channelName, so the two participants are simply assigned
 * 1 (caller) and 2 (callee) rather than hashing their cuid into a number.
 */
export function buildRtcToken(channelName: string, uid: number): string {
  const appId = getAgoraAppId();
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  if (!appCertificate) throw new Error("AGORA_APP_CERTIFICATE is not set");

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    TOKEN_TTL_SECONDS,
    TOKEN_TTL_SECONDS
  );
}
