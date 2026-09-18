// ---------------------------------------------------------------------------
// Payment gateway adapter — PayPal (added alongside AzamPay's mobile-money
// checkout, not replacing it — the member picks a method on
// /malipo/[orderId]). Unlike AzamPay's MNO Checkout, PayPal's Capture call
// is synchronous and returns a definitive result directly in the response —
// the webhook here (see app/api/payments/paypal/webhook/route.ts) is
// defense-in-depth for the rare case a capture succeeds on PayPal's side but
// the response never reaches us, not the only way to learn the outcome the
// way AzamPay's webhook was.
//
// CONFIRMED live (2026-09-18): a client_credentials grant against
// /v1/oauth2/token with the real production Client ID/Secret returned a
// real access_token (200 OK) — verified with a direct curl call before any
// of this was written.
// ---------------------------------------------------------------------------

const PAYPAL_API_BASE_URL = process.env.PAYPAL_API_BASE_URL;

export function isPaypalConfigured(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && PAYPAL_API_BASE_URL && process.env.PAYPAL_WEBHOOK_ID
  );
}

// In-memory token cache, same shape as AzamPay's — PayPal's token is
// short-lived (observed expires_in ~32400s / 9h on the live call above).
let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchPaypalToken(): Promise<{ token: string; expiresAt: number } | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!PAYPAL_API_BASE_URL || !clientId || !clientSecret) return null;

  let res: Response;
  try {
    res = await fetch(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
  } catch {
    return null;
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || typeof body?.access_token !== "string") return null;

  const expiresInMs = typeof body.expires_in === "number" ? body.expires_in * 1000 : 9 * 60 * 60 * 1000;
  return { token: body.access_token, expiresAt: Date.now() + expiresInMs };
}

async function getPaypalToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
    return cachedToken.token;
  }
  const fresh = await fetchPaypalToken();
  if (!fresh) {
    cachedToken = null;
    return null;
  }
  cachedToken = fresh;
  return fresh.token;
}

export type CreateOrderResult =
  | { success: true; paypalOrderId: string }
  | { success: false; reason: "GATEWAY_NOT_CONFIGURED" | "GATEWAY_ERROR"; detail?: string };

/**
 * reference_id is set to our own Order.id — this is what lets capture
 * verification confirm a captured PayPal order actually belongs to the
 * Nusrah order it's being applied to, instead of trusting a
 * client-supplied paypalOrderId at face value (see confirmPaypalOrderPaid).
 */
export async function createPaypalOrder(orderId: string, amountUsdCents: number): Promise<CreateOrderResult> {
  if (!isPaypalConfigured()) return { success: false, reason: "GATEWAY_NOT_CONFIGURED" };

  const token = await getPaypalToken();
  if (!token) return { success: false, reason: "GATEWAY_ERROR", detail: "Could not obtain a PayPal auth token" };

  let res: Response;
  try {
    res = await fetch(`${PAYPAL_API_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: orderId,
            amount: { currency_code: "USD", value: (amountUsdCents / 100).toFixed(2) },
          },
        ],
      }),
    });
  } catch (err) {
    return { success: false, reason: "GATEWAY_ERROR", detail: String(err) };
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || typeof body?.id !== "string") {
    return { success: false, reason: "GATEWAY_ERROR", detail: JSON.stringify(body) };
  }

  return { success: true, paypalOrderId: body.id };
}

export type PaypalCaptureDetails = { referenceId: string; capturedUsdCents: number; captureId: string };

export type CaptureOrderResult =
  | ({ success: true } & PaypalCaptureDetails)
  | { success: false; reason: "GATEWAY_NOT_CONFIGURED" | "GATEWAY_ERROR" | "NOT_COMPLETED"; detail?: string };

function parseCaptureDetails(body: Record<string, unknown> | null): PaypalCaptureDetails | null {
  const unit = (body?.purchase_units as Record<string, unknown>[] | undefined)?.[0];
  const payments = unit?.payments as Record<string, unknown> | undefined;
  const capture = (payments?.captures as Record<string, unknown>[] | undefined)?.[0];
  const amount = capture?.amount as Record<string, unknown> | undefined;

  const referenceId = unit?.reference_id;
  const amountValue = amount?.value;
  const captureId = capture?.id;
  if (typeof referenceId !== "string" || typeof amountValue !== "string" || typeof captureId !== "string") {
    return null;
  }
  return { referenceId, capturedUsdCents: Math.round(parseFloat(amountValue) * 100), captureId };
}

/** Finalizes a payment the member just approved — the primary, synchronous confirmation path. */
export async function capturePaypalOrder(paypalOrderId: string): Promise<CaptureOrderResult> {
  if (!isPaypalConfigured()) return { success: false, reason: "GATEWAY_NOT_CONFIGURED" };

  const token = await getPaypalToken();
  if (!token) return { success: false, reason: "GATEWAY_ERROR", detail: "Could not obtain a PayPal auth token" };

  let res: Response;
  try {
    res = await fetch(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  } catch (err) {
    return { success: false, reason: "GATEWAY_ERROR", detail: String(err) };
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) return { success: false, reason: "GATEWAY_ERROR", detail: JSON.stringify(body) };
  if (body?.status !== "COMPLETED") return { success: false, reason: "NOT_COMPLETED", detail: JSON.stringify(body) };

  const details = parseCaptureDetails(body);
  if (!details) return { success: false, reason: "GATEWAY_ERROR", detail: "Malformed capture response" };

  return { success: true, ...details };
}

/** Re-fetches an order's already-captured details — used by the webhook path, which must never re-capture an order that's already been captured. */
export async function getPaypalOrderCaptureDetails(paypalOrderId: string): Promise<CaptureOrderResult> {
  if (!isPaypalConfigured()) return { success: false, reason: "GATEWAY_NOT_CONFIGURED" };

  const token = await getPaypalToken();
  if (!token) return { success: false, reason: "GATEWAY_ERROR", detail: "Could not obtain a PayPal auth token" };

  let res: Response;
  try {
    res = await fetch(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${paypalOrderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    return { success: false, reason: "GATEWAY_ERROR", detail: String(err) };
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) return { success: false, reason: "GATEWAY_ERROR", detail: JSON.stringify(body) };

  const details = parseCaptureDetails(body);
  if (!details) return { success: false, reason: "NOT_COMPLETED", detail: JSON.stringify(body) };

  return { success: true, ...details };
}

export type PaypalWebhookHeaders = {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  transmissionSig: string | null;
  authAlgo: string | null;
};

/**
 * Confirmed shape (PayPal REST docs, checked 2026-09-18): POST the
 * transmission headers plus the raw event body to
 * /v1/notifications/verify-webhook-signature, keyed by our own
 * PAYPAL_WEBHOOK_ID (configured on the specific webhook subscription in the
 * dashboard — a separate value from Client ID/Secret). Fails closed on any
 * error or a non-SUCCESS result.
 */
export async function verifyPaypalWebhookSignature(rawBody: string, headers: PaypalWebhookHeaders): Promise<boolean> {
  if (!isPaypalConfigured()) return false;
  if (!headers.transmissionId || !headers.transmissionTime || !headers.certUrl || !headers.transmissionSig) {
    return false;
  }

  const token = await getPaypalToken();
  if (!token) return false;

  let webhookEvent: unknown;
  try {
    webhookEvent = JSON.parse(rawBody);
  } catch {
    return false;
  }

  let res: Response;
  try {
    res = await fetch(`${PAYPAL_API_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        transmission_id: headers.transmissionId,
        transmission_time: headers.transmissionTime,
        cert_url: headers.certUrl,
        auth_algo: headers.authAlgo ?? "SHA256withRSA",
        transmission_sig: headers.transmissionSig,
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: webhookEvent,
      }),
    });
  } catch {
    return false;
  }

  const body = await res.json().catch(() => null);
  return res.ok && body?.verification_status === "SUCCESS";
}

export type PaypalWebhookEvent = { eventType: string; paypalOrderId: string | null };

export function parsePaypalWebhookEvent(rawBody: string): PaypalWebhookEvent | null {
  let body: Record<string, unknown> | null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return null;
  }
  const eventType = body?.event_type;
  if (typeof eventType !== "string") return null;

  const resource = body?.resource as Record<string, unknown> | undefined;
  const supplementaryData = resource?.supplementary_data as Record<string, unknown> | undefined;
  const relatedIds = supplementaryData?.related_ids as Record<string, unknown> | undefined;
  const paypalOrderId = typeof relatedIds?.order_id === "string" ? relatedIds.order_id : null;

  return { eventType, paypalOrderId };
}
