import { redirect } from "next/navigation";
import { getSessionAdminUser } from "@/lib/admin-auth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  const admin = await getSessionAdminUser();
  if (admin) redirect("/admin/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-mosque-pattern px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-navy">Nusrah Admin</h1>
        <p className="mt-1 text-center text-sm text-neutral-500">Sign in to continue</p>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
