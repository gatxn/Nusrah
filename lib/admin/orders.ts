import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const ADMIN_ORDERS_PAGE_SIZE = 20;

export type AdminOrderRow = {
  id: string;
  userId: string;
  userName: string;
  packageName: string;
  amountTzs: number;
  currency: string;
  amountUsdCents: number | null;
  status: string;
  createdAt: Date;
};

export type AdminOrderListParams = {
  page: number;
  status?: "PENDING" | "PAID" | "FAILED";
  pendingOnly?: boolean; // the unified Membership Approvals / Payment Confirmations queue
};

const PENDING_AGE_THRESHOLD_HOURS = 1;

export async function queryAdminOrders(
  params: AdminOrderListParams
): Promise<{ orders: AdminOrderRow[]; page: number; pageSize: number; totalCount: number }> {
  const { page, status, pendingOnly = false } = params;
  const skip = (page - 1) * ADMIN_ORDERS_PAGE_SIZE;

  const where: Prisma.OrderWhereInput = pendingOnly
    ? {
        status: "PENDING",
        createdAt: { lt: new Date(Date.now() - PENDING_AGE_THRESHOLD_HOURS * 60 * 60 * 1000) },
      }
    : status
      ? { status }
      : {};

  const [rows, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        amountTzs: true,
        currency: true,
        amountUsdCents: true,
        status: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true } },
        package: { select: { name: true } },
      },
      orderBy: { createdAt: pendingOnly ? "asc" : "desc" },
      skip,
      take: ADMIN_ORDERS_PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: rows.map((o) => ({
      id: o.id,
      userId: o.userId,
      userName: o.user.name,
      packageName: o.package.name,
      amountTzs: o.amountTzs,
      currency: o.currency,
      amountUsdCents: o.amountUsdCents,
      status: o.status,
      createdAt: o.createdAt,
    })),
    page,
    pageSize: ADMIN_ORDERS_PAGE_SIZE,
    totalCount,
  };
}

export type AdminOrderDetail = AdminOrderRow & {
  userPhone: string;
  packageTier: string;
  packageDurationDays: number;
  transactions: { id: string; gatewayTxnId: string | null; gateway: string | null; verifiedAt: Date | null }[];
};

export async function getAdminOrderDetail(orderId: string): Promise<AdminOrderDetail | null> {
  const o = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, phone: true } },
      package: { select: { name: true, tier: true, durationDays: true } },
      transactions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!o) return null;

  return {
    id: o.id,
    userId: o.userId,
    userName: o.user.name,
    userPhone: o.user.phone,
    packageName: o.package.name,
    packageTier: o.package.tier,
    packageDurationDays: o.package.durationDays,
    amountTzs: o.amountTzs,
    currency: o.currency,
    amountUsdCents: o.amountUsdCents,
    status: o.status,
    createdAt: o.createdAt,
    transactions: o.transactions.map((t) => ({
      id: t.id,
      gatewayTxnId: t.gatewayTxnId,
      gateway: t.gateway,
      verifiedAt: t.verifiedAt,
    })),
  };
}

export type ConfirmOrderResult =
  | { ok: true }
  | { ok: false; reason: "NOT_FOUND" | "NOT_PENDING" };

/**
 * Productionizes the exact manual workflow (create Transaction, mark Order
 * PAID, upsert Subscription) done by hand via Prisma scripts throughout
 * this session's PalmPesa/AzamPay saga — reusing the identical
 * $transaction shape from app/api/payments/webhook/route.ts, but tagged
 * gateway: "manual_admin" with the confirming admin's id recorded in
 * rawPayload, so a manual confirmation stays permanently distinguishable
 * from a real gateway confirmation. Never mislabel this as a real gateway
 * name — that would corrupt the audit trail this session's entire
 * gateway investigation depended on.
 */
export async function confirmOrderManually(orderId: string, adminId: string): Promise<ConfirmOrderResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { package: true } });
  if (!order) return { ok: false, reason: "NOT_FOUND" };
  if (order.status !== "PENDING") return { ok: false, reason: "NOT_PENDING" };

  const expiryDate = new Date(Date.now() + order.package.durationDays * 24 * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        orderId: order.id,
        gatewayTxnId: null,
        gateway: "manual_admin",
        phoneNumber: null,
        verifiedAt: new Date(),
        rawPayload: `Manually confirmed by admin ${adminId} on ${new Date().toISOString()}`,
      },
    }),
    prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
    prisma.subscription.upsert({
      where: { userId: order.userId },
      create: { userId: order.userId, packageId: order.packageId, status: "ACTIVE", expiryDate },
      update: { packageId: order.packageId, status: "ACTIVE", expiryDate, startDate: new Date() },
    }),
  ]);

  return { ok: true };
}

export async function rejectOrderManually(orderId: string): Promise<ConfirmOrderResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, reason: "NOT_FOUND" };
  if (order.status !== "PENDING") return { ok: false, reason: "NOT_PENDING" };

  // No fabricated Transaction row — unlike a confirmed payment, there's no
  // real gateway proof of anything to record for a rejection.
  await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
  return { ok: true };
}
