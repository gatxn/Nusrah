import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;

export type OtpPurpose = "REGISTER" | "LOGIN";

function generateOtpCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return String(n);
}

export class OtpDeliveryNotConfiguredError extends Error {
  constructor() {
    super("OTP delivery is not configured for production (no EMAIL_PROVIDER set)");
    this.name = "OtpDeliveryNotConfiguredError";
  }
}

/**
 * Email delivery via Resend's plain HTTP API (no SDK dependency — this
 * project's shared-hosting build has repeatedly broken on native/bundled
 * npm packages, so a single `fetch` call is deliberately preferred here).
 * Returns false (not "sent") when no provider is configured, so the caller
 * can fall back to the dev-mode stub instead of failing outright.
 */
async function deliverOtpEmail(email: string, code: string): Promise<boolean> {
  const provider = process.env.EMAIL_PROVIDER?.trim();
  if (!provider) return false;

  if (provider !== "resend") {
    throw new Error(`Unknown EMAIL_PROVIDER "${provider}"`);
  }

  const apiKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();
  const from = process.env.EMAIL_FROM_ADDRESS?.trim();
  if (!apiKey || !from) {
    throw new Error(
      "EMAIL_PROVIDER=resend is set but EMAIL_PROVIDER_API_KEY / EMAIL_FROM_ADDRESS is missing."
    );
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Nusrah - Kodi yako ya Uthibitisho",
      text: `Kodi yako ya uthibitisho ni ${code}. Inaisha muda wake baada ya dakika ${OTP_TTL_MINUTES}.`,
      html: `<p>Kodi yako ya uthibitisho ni <strong style="font-size:20px">${code}</strong>.</p><p>Inaisha muda wake baada ya dakika ${OTP_TTL_MINUTES}.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend request failed (${res.status}): ${body}`);
  }

  return true;
}

/**
 * Delivery dispatcher: OTP is sent by email only. Falls back to the dev-mode
 * stub (code logged server-side and echoed to the caller) only when no email
 * provider is configured at all.
 *
 * Guardrail: the dev-mode fallback only runs outside production. If this
 * ever gets deployed with NODE_ENV=production before EMAIL_PROVIDER is
 * configured, registration fails loudly instead of leaking OTP codes to any
 * visitor.
 */
async function deliverOtp(email: string, code: string): Promise<{ devMode: boolean }> {
  const sent = await deliverOtpEmail(email, code);
  if (sent) return { devMode: false };

  if (process.env.NODE_ENV === "production") {
    throw new OtpDeliveryNotConfiguredError();
  }
  console.log(`[DEV OTP] ${email} -> ${code} (expires in ${OTP_TTL_MINUTES}m)`);
  return { devMode: true };
}

export async function createAndSendOtp(
  userId: string,
  email: string,
  purpose: OtpPurpose
): Promise<{ devCode?: string }> {
  // Invalidate any prior unconsumed codes for this user+purpose.
  await prisma.otpCode.updateMany({
    where: { userId, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { userId, purpose, codeHash, expiresAt },
  });

  const { devMode } = await deliverOtp(email, code);
  return devMode ? { devCode: code } : {};
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "INVALID_CODE" };

export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  code: string
): Promise<VerifyOtpResult> {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, reason: "NOT_FOUND" };
  if (otp.expiresAt.getTime() < Date.now()) return { ok: false, reason: "EXPIRED" };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "TOO_MANY_ATTEMPTS" };

  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "INVALID_CODE" };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}
