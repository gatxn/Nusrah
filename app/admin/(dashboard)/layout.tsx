import { redirect } from "next/navigation";
import { getSessionAdminUser } from "@/lib/admin-auth";
import { unreadAdminAlertCount } from "@/lib/admin/alerts";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getSessionAdminUser();
  if (!admin) redirect("/admin/login");

  const unreadAlerts = await unreadAdminAlertCount();

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ps-64">
        <AdminTopBar name={admin.name} unreadAlerts={unreadAlerts} />
        <main>{children}</main>
      </div>
    </div>
  );
}
