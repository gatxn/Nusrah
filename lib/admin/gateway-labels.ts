// Transaction.gateway holds either a specific AzamPay mobile-money operator
// name (e.g. "Airtel", "Tigo"), the "azampay" fallback when no operator name
// came through, "paypal", or a manual-confirmation tag — never a fixed enum
// (see schema.prisma). Grouped into 3 human categories for admin-facing
// display; anything not recognized as paypal/manual falls under mobile
// money, since that covers every real AzamPay operator name whatever it
// happens to be.
//
// Matched by prefix, not exact string: earlier in this project's history,
// orders were hand-verified via one-off scripts tagged "manual-verification"
// before the "manual_admin" convention (Order confirm button) existed. An
// exact match on "manual_admin" alone would silently mislabel those real
// orders as AzamPay mobile-money revenue — corrupting the very audit trail
// this distinction exists to protect.
export function gatewayCategory(gateway: string | null): "PAYPAL" | "MANUAL" | "MOBILE_MONEY" {
  if (gateway === "paypal") return "PAYPAL";
  if (gateway?.startsWith("manual")) return "MANUAL";
  return "MOBILE_MONEY";
}

export const GATEWAY_CATEGORY_LABELS: Record<ReturnType<typeof gatewayCategory>, string> = {
  MOBILE_MONEY: "AzamPay (Mobile Money)",
  PAYPAL: "PayPal",
  MANUAL: "Manually Confirmed by Admin",
};
