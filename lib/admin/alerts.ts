import { prisma } from "@/lib/db";

export type AdminAlertType = "NEW_REPORT" | "NEW_REGISTRATION";

const ADMIN_ALERTS_LIMIT = 50;

export type AdminAlertView = {
  id: string;
  type: AdminAlertType;
  message: string;
  linkHref: string | null;
  isRead: boolean;
  createdAt: Date;
};

// No dedup needed here, unlike lib/notifications.ts's maybeNotify — each of
// these fires once per genuinely distinct event (one report filed, one
// member's onboarding completed), never a repeat-tap action a user could
// spam.
export async function createAdminAlert(type: AdminAlertType, message: string, linkHref?: string): Promise<void> {
  await prisma.adminAlert.create({ data: { type, message, linkHref } });
}

export async function queryAdminAlerts(): Promise<{ alerts: AdminAlertView[]; unreadCount: number }> {
  const [alerts, unreadCount] = await Promise.all([
    prisma.adminAlert.findMany({ orderBy: { createdAt: "desc" }, take: ADMIN_ALERTS_LIMIT }),
    prisma.adminAlert.count({ where: { isRead: false } }),
  ]);

  return {
    alerts: alerts.map((a) => ({
      id: a.id,
      type: a.type as AdminAlertType,
      message: a.message,
      linkHref: a.linkHref,
      isRead: a.isRead,
      createdAt: a.createdAt,
    })),
    unreadCount,
  };
}

export async function unreadAdminAlertCount(): Promise<number> {
  return prisma.adminAlert.count({ where: { isRead: false } });
}

export async function markAllAdminAlertsRead(): Promise<void> {
  await prisma.adminAlert.updateMany({ where: { isRead: false }, data: { isRead: true } });
}
