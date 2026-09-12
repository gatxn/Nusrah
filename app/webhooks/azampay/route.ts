// Alias for app/api/payments/webhook/route.ts — same handler, reachable at a
// second, AzamPay-specific path. Exists because a dedicated AzamPay app
// registration (separate from the shared "Skybando" app — see the
// azampay_webhook_destination_unknown project note) needs its own callback
// URL to configure, and this path was chosen for that new registration.
export { POST } from "@/app/api/payments/webhook/route";
