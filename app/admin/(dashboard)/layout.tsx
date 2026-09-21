import { redirect } from "next/navigation";
import { getSessionAdminUser } from "@/lib/admin-auth";
import { unreadAdminAlertCount } from "@/lib/admin/alerts";
import { getAdminAttentionCounts } from "@/lib/admin/attention";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getSessionAdminUser();
  if (!admin) redirect("/admin/login");

  const [unreadAlerts, attention] = await Promise.all([unreadAdminAlertCount(), getAdminAttentionCounts()]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar attention={attention} />
      <div className="lg:ps-64 print:ps-0">
        <AdminTopBar name={admin.name} unreadAlerts={unreadAlerts} />
        <main>{children}</main>
      </div>
    </div>
  );
}
