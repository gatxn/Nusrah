// Sends an AzamPay-shaped, correctly-signed webhook payload to a running
// dev server, to test the full activation path end-to-end — payload
// parsing, order lookup, idempotency, AND signature verification, all the
// way through to the real Transaction/Order/Subscription writes.
//
// Unlike PalmPesa (unsigned callbacks, which forced the old version of this
// script to only test plumbing — real activation needed a real PalmPesa
// order verified against their broken /api/order-status), AzamPay signs its
// webhooks via `x-azampay-signature`. This script signs its payload the
// same way lib/payments/gateway.ts's verifyWebhookSignature expects, so a
// full local activation CAN be faked here — deliberately, for local testing
// only. This is exactly why the signature (not the payload body) is the
// entire trust boundary in production: never run this against anything but
// your own local dev server.
//
// ⚠️ The signature algorithm here is the same best-effort assumption
// documented in lib/payments/gateway.ts (HMAC-SHA256 over the raw body,
// hex-encoded) — unconfirmed against a real AzamPay webhook delivery. If
// AzamPay's real signature scheme turns out to differ, update both this
// script and verifyWebhookSignature together once confirmed.
//
// Usage:
//   npm run test:webhook -- <orderId> [status=success|failed|pending]
//   (omit orderId to auto-pick the most recent PENDING order)

import { createHmac } from "node:crypto";
import { prisma } from "../lib/db.ts";

async function main() {
  const [, , orderIdArg, statusArg] = process.argv;
  const status = statusArg === "failed" ? "failed" : statusArg === "pending" ? "pending" : "success";

  const order = orderIdArg
    ? await prisma.order.findUnique({ where: { id: orderIdArg } })
    : await prisma.order.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });

  if (!order) {
    console.error("No order found. Create one via POST /api/orders first, or pass an orderId explicitly.");
    process.exit(1);
  }

  const payload = {
    externalId: order.id,
    amount: String(order.amountTzs),
    transactionstatus: status,
    transid: `TEST-TXN-${Date.now()}`,
    msisdn: "255700000000",
    operator: "MPESA",
    message: "Local test webhook",
  };
  const rawBody = JSON.stringify(payload);

  const clientSecret = process.env.AZAMPAY_CLIENT_SECRET;
  if (!clientSecret) {
    console.error("AZAMPAY_CLIENT_SECRET is not set in .env — cannot sign a test payload.");
    process.exit(1);
  }
  const signature = createHmac("sha256", clientSecret).update(rawBody).digest("hex");

  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-azampay-signature": signature },
    body: rawBody,
  });

  console.log("Sent payload:", payload);
  console.log("Response:", res.status, await res.json());

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
