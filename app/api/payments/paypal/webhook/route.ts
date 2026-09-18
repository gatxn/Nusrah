import { NextRequest, NextResponse } from "next/server";
import { verifyPaypalWebhookSignature, parsePaypalWebhookEvent, getPaypalOrderCaptureDetails } from "@/lib/payments/paypal";
import { confirmPaypalOrderPaid } from "@/lib/payments/confirm-paypal";

// ---------------------------------------------------------------------------
// Defense-in-depth only — the primary confirmation path is
// /api/payments/paypal/capture-order, whose capture call is synchronous and
// authoritative on its own. This exists for the rare case a capture
// succeeds on PayPal's side but the response never reaches the client (tab
// closed, network drop) before it could call capture-order itself.
//
// A completed capture can never be captured again, so unlike capture-order
// (which calls PayPal's capture endpoint), this re-fetches the order's
// already-captured details via GET instead — see
// getPaypalOrderCaptureDetails in lib/payments/paypal.ts.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const verified = await verifyPaypalWebhookSignature(rawBody, {
    transmissionId: request.headers.get("paypal-transmission-id"),
    transmissionTime: request.headers.get("paypal-transmission-time"),
    certUrl: request.headers.get("paypal-cert-url"),
    transmissionSig: request.headers.get("paypal-transmission-sig"),
    authAlgo: request.headers.get("paypal-auth-algo"),
  });
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = parsePaypalWebhookEvent(rawBody);
  if (!event) {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  if (event.eventType !== "PAYMENT.CAPTURE.COMPLETED" || !event.paypalOrderId) {
    return NextResponse.json({ message: "Ignored" });
  }

  const details = await getPaypalOrderCaptureDetails(event.paypalOrderId);
  if (!details.success) {
    console.error("PayPal webhook: could not fetch capture details:", details.reason, details.detail);
    return NextResponse.json({ error: "Could not verify capture" }, { status: 502 });
  }

  const result = await confirmPaypalOrderPaid(details.referenceId, details.capturedUsdCents, details.captureId, rawBody);
  if (result === "ORDER_NOT_FOUND" || result === "MISMATCH") {
    console.error("PayPal webhook: capture rejected:", result, details);
    return NextResponse.json({ error: "Rejected" }, { status: 502 });
  }

  return NextResponse.json({ message: "Processed" });
}
