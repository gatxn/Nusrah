import { getSessionAdminUser } from "@/lib/admin-auth";

// Placeholder — the real stat cards, charts, and pending-actions panel are
// built in Phase 5 of the admin dashboard plan, once Users/Verification
// (Phase 2), Reports (Phase 3), and Payments (Phase 4) exist to draw data
// from. This page exists in Phase 1 only so login has somewhere real to
// land, proving the auth/routing/shell actually works end to end.
export default async function AdminDashboardPage() {
  const admin = await getSessionAdminUser();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">Welcome back, {admin?.name}.</p>
      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">
          Admin login, routing, and access control are set up and working. Stat cards, charts, and the
          rest of this dashboard are built out in the next phases of the plan.
        </p>
      </div>
    </div>
  );
}
