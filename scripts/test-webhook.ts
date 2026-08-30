// Proves the golden-rule webhook chain (§4.2) works end-to-end without a
// real payment gateway: signs a payload with the same HMAC secret the
// webhook route falls back to (DEV_WEBHOOK_TEST_SECRET) and posts it to a
// running dev server.
//
// Usage:
//   npm run test:webhook -- <orderId> [status=success|failed]
//   (omit orderId to auto-pick the most recent PENDING order)

import { createHmac, randomUUID } from "crypto";
import { prisma } from "../lib/db.ts";

async function main() {
  const [, , orderIdArg, statusArg] = process.argv;
  const status = statusArg === "failed" ? "failed" : "success";

  const order = orderIdArg
    ? await prisma.order.findUnique({ where: { id: orderIdArg } })
    : await prisma.order.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
      });

  if (!order) {
    console.error(
      "No order found. Create one via POST /api/orders first, or pass an orderId explicitly."
    );
    process.exit(1);
  }

  const payload = {
    gatewayTxnId: `TEST-${randomUUID()}`,
    orderId: order.id,
    status,
    phoneNumber: "0712345678",
    amountTzs: order.amountTzs,
    gateway: "dev-test",
  };
  const rawBody = JSON.stringify(payload);

  const secret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || process.env.DEV_WEBHOOK_TEST_SECRET;
  if (!secret) {
    console.error("Set DEV_WEBHOOK_TEST_SECRET (or PAYMENT_GATEWAY_WEBHOOK_SECRET) in .env first.");
    process.exit(1);
  }
  const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-webhook-signature": signature },
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
