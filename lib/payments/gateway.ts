// ---------------------------------------------------------------------------
// Payment gateway adapter — AzamPay (replaces PalmPesa; PalmPesa's
// /api/order-status never recognized our own order_id, so no real payment
// could ever auto-activate a subscription — see the
// palmpesa_order_id_correlation_broken project note).
//
// ⚠️ UNVERIFIED FIELD NAMES: the token/checkout endpoint URLs below came
// directly from AzamPay in writing (a real credentials email), so those are
// trustworthy. Everything else — the exact JSON field names in the token
// response, the checkout response, and the webhook payload, plus the
// webhook signature algorithm — was built from AzamPay's public docs/SDKs,
// NOT confirmed against a live successful call, because the credentials on
// hand when this was written were rejected by AzamPay as expired/invalid.
// Every parsing function below is written defensively (tries multiple
// candidate field names) and documents exactly what's assumed vs. known.
// Do not treat this integration as verified until a real payment has gone
// through it end-to-end with working credentials.
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from "node:crypto";

const AZAMPAY_AUTH_URL = process.env.AZAMPAY_AUTH_URL;
const AZAMPAY_CHECKOUT_URL = process.env.AZAMPAY_CHECKOUT_URL;

export function isGatewayConfigured(): boolean {
  return Boolean(
    process.env.AZAMPAY_APP_NAME &&
      process.env.AZAMPAY_CLIENT_ID &&
      process.env.AZAMPAY_CLIENT_SECRET &&
      AZAMPAY_AUTH_URL &&
      AZAMPAY_CHECKOUT_URL
  );
}

export type AzamPayProvider = "Airtel" | "Tigo" | "Halopesa" | "Azampesa" | "Mpesa";
export const AZAMPAY_PROVIDERS: AzamPayProvider[] = ["Airtel", "Tigo", "Halopesa", "Azampesa", "Mpesa"];

function decodeJwtExpiry(jwt: string): number | null {
  try {
    const payload = jwt.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

// In-memory token cache — AzamPay's token is a short-lived JWT (unlike
// PalmPesa's static, non-expiring API key), so it's fetched once and reused
// until it's within a minute of expiry.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchAzamPayToken(): Promise<{ token: string; expiresAt: number } | null> {
  if (!AZAMPAY_AUTH_URL) return null;

  let res: Response;
  try {
    res = await fetch(AZAMPAY_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        appName: process.env.AZAMPAY_APP_NAME,
        clientId: process.env.AZAMPAY_CLIENT_ID,
        clientSecret: process.env.AZAMPAY_CLIENT_SECRET,
      }),
    });
  } catch {
    return null;
  }

  // Confirmed real response envelope (observed directly from a live,
  // failed-auth call): { data, message, success, messageCode, statusCode,
  // sessionId, rememberMe }. `data` is null on failure — assumed to hold
  // the token (or {accessToken}) on success; not yet confirmed which.
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) return null;

  const token = body?.data?.accessToken ?? body?.data?.token ?? (typeof body?.data === "string" ? body.data : null);
  if (typeof token !== "string" || !token) return null;

  const expiresAt = decodeJwtExpiry(token) ?? Date.now() + 55 * 60 * 1000;
  return { token, expiresAt };
}

async function getAzamPayToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
    return cachedToken.token;
  }
  const fresh = await fetchAzamPayToken();
  if (!fresh) {
    cachedToken = null;
    return null;
  }
  cachedToken = fresh;
  return fresh.token;
}

export type InitiateChargeInput = {
  orderId: string;
  amountTzs: number;
  phoneNumber: string;
  provider: AzamPayProvider;
};

export type InitiateChargeResult =
  | { success: true }
  | { success: false; reason: "GATEWAY_NOT_CONFIGURED" | "GATEWAY_ERROR"; detail?: string };

/**
 * MNO Checkout: pushes a payment prompt directly to the customer's phone
 * (no hosted redirect page, unlike PalmPesa) — the customer confirms with
 * their mobile money PIN, and AzamPay's webhook (see verifyWebhookSignature
 * / parseWebhookPayload below) reports the result.
 */
export async function initiateCharge(input: InitiateChargeInput): Promise<InitiateChargeResult> {
  if (!isGatewayConfigured()) return { success: false, reason: "GATEWAY_NOT_CONFIGURED" };

  const token = await getAzamPayToken();
  if (!token) {
    return { success: false, reason: "GATEWAY_ERROR", detail: "Could not obtain an AzamPay auth token" };
  }

  let res: Response;
  try {
    res = await fetch(AZAMPAY_CHECKOUT_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        accountNumber: input.phoneNumber,
        amount: String(input.amountTzs),
        currency: "TZS",
        externalId: input.orderId,
        provider: input.provider,
      }),
    });
  } catch (err) {
    return { success: false, reason: "GATEWAY_ERROR", detail: String(err) };
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.success === false) {
    return { success: false, reason: "GATEWAY_ERROR", detail: JSON.stringify(body) };
  }

  return { success: true };
}

/**
 * Verifies AzamPay's `x-azampay-signature` webhook header.
 *
 * ⚠️ UNVERIFIED: the exact signing algorithm (which secret, what's signed —
 * raw body vs. a specific field, hex vs. base64) was not confirmed against
 * a live webhook delivery. This implements the most common pattern used by
 * comparable gateways — HMAC-SHA256 over the raw request body, keyed with
 * the client secret, hex-encoded — as a best-effort default. Fails closed:
 * never grants access on a signature it can't positively verify. MUST be
 * confirmed against a real webhook before this integration is trusted live.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !process.env.AZAMPAY_CLIENT_SECRET) return false;

  const expected = createHmac("sha256", process.env.AZAMPAY_CLIENT_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signatureHeader, "utf8");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export type WebhookPayload = {
  externalId: string;
  status: "success" | "failed" | "pending";
  transactionId?: string;
  msisdn?: string;
  provider?: string;
};

/**
 * Parses AzamPay's webhook body. Field names are best-effort (see file-top
 * warning) — tries multiple candidate keys seen across AzamPay's scattered
 * public examples (`externalId`, `utilityref`, `reference`) since the
 * authoritative shape wasn't confirmed live before this was written.
 */
export function parseWebhookPayload(rawBody: string): WebhookPayload | null {
  let body: Record<string, unknown> | null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (!body) return null;

  const externalId = body.externalId ?? body.utilityref ?? body.reference;
  if (typeof externalId !== "string" || !externalId) return null;

  const rawStatus = String(body.transactionstatus ?? body.status ?? "").toLowerCase();
  const status: WebhookPayload["status"] =
    rawStatus === "success" || rawStatus === "completed"
      ? "success"
      : rawStatus === "failed" || rawStatus === "failure"
        ? "failed"
        : "pending";

  return {
    externalId,
    status,
    transactionId: typeof body.transid === "string" ? body.transid : undefined,
    msisdn: typeof body.msisdn === "string" ? body.msisdn : undefined,
    provider: typeof body.operator === "string" ? body.operator : undefined,
  };
}
