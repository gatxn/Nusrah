// ---------------------------------------------------------------------------
// Payment gateway adapter — PalmPesa (a Selcom sub-merchant reseller).
// Docs: https://documentation.palmpesa.co.tz/ (no sandbox; PalmPesa's own
// guidance is to test with a small real amount, e.g. 200-500 TZS).
//
// SECURITY NOTE: PalmPesa's webhook callbacks are NOT signed — no HMAC or
// signature scheme is documented, unlike the HMAC-based design this file
// used to scaffold for a generic aggregator. Trusting a webhook body
// directly would let anyone who discovers the webhook URL POST a fake
// "COMPLETED" payload and unlock a subscription for free. To close that
// gap, the webhook route (app/api/payments/webhook/route.ts) never trusts
// the callback body's claimed status — it only reads which order to check,
// then calls checkOrderStatus() below to independently re-query PalmPesa's
// own /api/order-status endpoint with our own API credentials, and only
// that authenticated response is trusted.
// ---------------------------------------------------------------------------

const PALMPESA_BASE_URL = "https://palmpesa.drmlelwa.co.tz";

export function isGatewayConfigured(): boolean {
  return Boolean(
    process.env.PAYMENT_GATEWAY === "palmpesa" &&
      process.env.PAYMENT_GATEWAY_API_KEY &&
      process.env.PALMPESA_USER_ID &&
      Number.isFinite(Number(process.env.PALMPESA_USER_ID)) &&
      process.env.PALMPESA_TILL_NUMBER
  );
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.PAYMENT_GATEWAY_API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export type InitiateChargeInput = {
  orderId: string;
  amountTzs: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  webhookUrl: string;
  redirectUrl: string;
  cancelUrl: string;
};

export type InitiateChargeResult =
  | { success: true; checkoutUrl: string }
  | { success: false; reason: "GATEWAY_NOT_CONFIGURED" | "GATEWAY_ERROR"; detail?: string };

/**
 * "Pay by Link" (PalmPesa's hosted-checkout option): creates an order on
 * PalmPesa's side and returns a URL to their own checkout page (backed by
 * Selcom — the customer picks Selcom Pesa / TanQR / mobile number there).
 * We never collect mobile-money method or PIN ourselves.
 */
export async function initiateCharge(input: InitiateChargeInput): Promise<InitiateChargeResult> {
  if (!isGatewayConfigured()) {
    return { success: false, reason: "GATEWAY_NOT_CONFIGURED" };
  }

  let res: Response;
  try {
    res = await fetch(`${PALMPESA_BASE_URL}/api/process-payment`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: Number(process.env.PALMPESA_USER_ID),
        vendor: process.env.PALMPESA_TILL_NUMBER,
        order_id: input.orderId,
        buyer_email: input.buyerEmail,
        buyer_name: input.buyerName,
        buyer_phone: input.buyerPhone,
        amount: input.amountTzs,
        currency: "TZS",
        redirect_url: input.redirectUrl,
        cancel_url: input.cancelUrl,
        webhook: input.webhookUrl,
        buyer_remarks: "Nusrah membership payment",
        merchant_remarks: `Order ${input.orderId}`,
        no_of_items: 1,
      }),
    });
  } catch (err) {
    return { success: false, reason: "GATEWAY_ERROR", detail: String(err) };
  }

  const body = await res.json().catch(() => null);
  const checkoutUrl = body?.raw?.payment_gateway_url;
  if (!res.ok || typeof checkoutUrl !== "string") {
    return { success: false, reason: "GATEWAY_ERROR", detail: JSON.stringify(body) };
  }

  return { success: true, checkoutUrl };
}

export type OrderStatusResult =
  | {
      ok: true;
      status: "COMPLETED" | "PENDING" | "FAILED";
      transactionId?: string;
      channel?: string;
      msisdn?: string;
    }
  | { ok: false };

/**
 * Independently asks PalmPesa "what is the real status of this order",
 * authenticated with our own API token — the only status this codebase
 * ever trusts to activate a subscription (see SECURITY NOTE above).
 */
export async function checkOrderStatus(orderId: string): Promise<OrderStatusResult> {
  if (!isGatewayConfigured()) return { ok: false };

  let res: Response;
  try {
    res = await fetch(`${PALMPESA_BASE_URL}/api/order-status`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ order_id: orderId }),
    });
  } catch {
    return { ok: false };
  }
  if (!res.ok) return { ok: false };

  const body = await res.json().catch(() => null);
  const entry = body?.data?.[0];
  const status = entry?.payment_status;
  if (status !== "COMPLETED" && status !== "PENDING" && status !== "FAILED") {
    return { ok: false };
  }

  return {
    ok: true,
    status,
    transactionId: typeof entry.transid === "string" ? entry.transid : undefined,
    channel: typeof entry.channel === "string" ? entry.channel : undefined,
    msisdn: typeof entry.msisdn === "string" ? entry.msisdn : undefined,
  };
}

/**
 * Pulls the order id out of an incoming webhook body purely to know WHICH
 * order to re-verify — the payload's own claimed payment_status is never
 * trusted (see SECURITY NOTE above). Returns null for a malformed payload.
 */
export function extractOrderIdFromWebhook(rawBody: string): string | null {
  try {
    const body = JSON.parse(rawBody);
    const orderId = body?.data?.[0]?.order_id;
    return typeof orderId === "string" ? orderId : null;
  } catch {
    return null;
  }
}
