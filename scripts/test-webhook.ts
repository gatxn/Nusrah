// Sends a PalmPesa-shaped webhook payload to a running dev server, to check
// the route's basic plumbing (payload parsing, order lookup, idempotency).
//
// Unlike the generic aggregator this script originally targeted, PalmPesa's
// webhooks aren't signed — so the webhook route never trusts this payload's
// claimed status. It only reads `data[0].order_id` from it, then calls
// PalmPesa's own /api/order-status endpoint to independently verify. That
// means a full local test of ACTIVATION (not just plumbing) requires a real
// PalmPesa order that actually exists on their side — this script alone
// cannot fake a "COMPLETED" activation the way the old HMAC-signed version
// could, by design (see lib/payments/gateway.ts).
//
// Usage:
//   npm run test:webhook -- <orderId> [status=COMPLETED|FAILED|PENDING]
//   (omit orderId to auto-pick the most recent PENDING order)

import { prisma } from "../lib/db.ts";

async function main() {
  const [, , orderIdArg, statusArg] = process.argv;
  const status = statusArg === "FAILED" ? "FAILED" : statusArg === "PENDING" ? "PENDING" : "COMPLETED";

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
    reference: `TEST-${Date.now()}`,
    resultcode: status === "COMPLETED" ? "000" : "001",
    data: [
      {
        order_id: order.id,
        creation_date: new Date().toISOString(),
        amount: String(order.amountTzs),
        payment_status: status,
        transid: `TEST-TXN-${Date.now()}`,
        channel: "MPESA",
        reference: `TEST-${Date.now()}`,
        msisdn: "255700000000",
      },
    ],
  };
  const rawBody = JSON.stringify(payload);

  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody,
  });

  console.log("Sent payload:", payload);
  console.log("Response:", res.status, await res.json());
  console.log(
    "\nNote: activation only happens if checkOrderStatus() can independently confirm this " +
      "order with PalmPesa's real API — this script cannot fake that part."
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
