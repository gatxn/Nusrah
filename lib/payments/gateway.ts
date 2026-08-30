import { createHmac, timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// Payment gateway adapter — INTENTIONALLY PAUSED pending real credentials
// (M-Pesa / Tigo Pesa / Airtel Money via a Tanzanian aggregator such as
// Selcom, ClickPesa, Azampay, or DPO Pesapal). Do not implement a real
// initiateCharge() call until PAYMENT_GATEWAY* env vars are supplied — this
// file only holds the scaffolding so the rest of the system (orders,
// webhook verification, subscription activation) can be built and tested
// against it now.
// ---------------------------------------------------------------------------

export function isGatewayConfigured(): boolean {
  return Boolean(
    process.env.PAYMENT_GATEWAY &&
      process.env.PAYMENT_GATEWAY_API_KEY &&
      process.env.PAYMENT_GATEWAY_MERCHANT_ID
  );
}

export type InitiateChargeInput = {
  orderId: string;
  amountTzs: number;
  phoneNumber: string;
};

export type InitiateChargeResult =
  | { success: true; gatewayRef: string }
  | { success: false; reason: "GATEWAY_NOT_CONFIGURED" };

/**
 * Kicks off a mobile-money charge with the aggregator. Currently always
 * short-circuits to GATEWAY_NOT_CONFIGURED because no provider credentials
 * are set. Once PAYMENT_GATEWAY / PAYMENT_GATEWAY_API_KEY /
 * PAYMENT_GATEWAY_MERCHANT_ID are provided, implement the real STK-push /
 * charge request to the chosen aggregator here.
 */
export async function initiateCharge(
  input: InitiateChargeInput
): Promise<InitiateChargeResult> {
  if (!isGatewayConfigured()) {
    return { success: false, reason: "GATEWAY_NOT_CONFIGURED" };
  }

  // TODO: call the real gateway once credentials are configured.
  throw new Error(
    `Payment gateway credentials are set but no provider integration has been ` +
      `implemented yet (order ${input.orderId}). Add the real API call in lib/payments/gateway.ts.`
  );
}

export type NormalizedWebhookPayload = {
  gatewayTxnId: string;
  orderId: string;
  status: "success" | "failed";
  phoneNumber?: string;
  amountTzs?: number;
  gateway: string;
  raw: string;
};

/**
 * Verifies the webhook's HMAC-SHA256 signature. Uses the real
 * PAYMENT_GATEWAY_WEBHOOK_SECRET once it's configured; falls back to
 * DEV_WEBHOOK_TEST_SECRET so the golden-rule verification chain (§4.2) can
 * be exercised end-to-end with a hand-signed test payload before a real
 * gateway is wired in. See scripts/test-webhook.ts.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret =
    process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || process.env.DEV_WEBHOOK_TEST_SECRET;

  if (!secret || !signatureHeader) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const givenBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== givenBuf.length) return false;
  return timingSafeEqual(expectedBuf, givenBuf);
}

/**
 * Normalizes a raw webhook body into a provider-agnostic shape. This generic
 * shape (gatewayTxnId/orderId/status/amount/phone) is what the webhook route
 * consumes — when a real aggregator is wired in, translate its payload into
 * this shape here rather than changing the webhook route itself.
 */
export function parseWebhookPayload(rawBody: string): NormalizedWebhookPayload {
  const body = JSON.parse(rawBody);
  const { gatewayTxnId, orderId, status, phoneNumber, amountTzs, gateway } = body;

  if (typeof gatewayTxnId !== "string" || typeof orderId !== "string") {
    throw new Error("Malformed webhook payload: missing gatewayTxnId/orderId");
  }
  if (status !== "success" && status !== "failed") {
    throw new Error("Malformed webhook payload: status must be success|failed");
  }

  return {
    gatewayTxnId,
    orderId,
    status,
    phoneNumber: typeof phoneNumber === "string" ? phoneNumber : undefined,
    amountTzs: typeof amountTzs === "number" ? amountTzs : undefined,
    gateway: typeof gateway === "string" ? gateway : "unconfigured",
    raw: rawBody,
  };
}
