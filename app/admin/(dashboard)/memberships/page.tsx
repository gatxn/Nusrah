import { listAdminPackages } from "@/lib/admin/packages";
import PackageEditForm from "@/components/admin/PackageEditForm";

export default async function AdminMembershipsPage() {
  const packages = await listAdminPackages();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-navy">Memberships</h1>
      <p className="mt-1 text-sm text-neutral-500">Edit pricing, duration, and features for each tier.</p>

      <div className="mt-6 space-y-4">
        {packages.map((pkg) => (
          <PackageEditForm key={pkg.id} pkg={pkg} />
        ))}
      </div>
    </div>
  );
}
