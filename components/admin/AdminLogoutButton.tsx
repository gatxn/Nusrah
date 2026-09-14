"use client";

export default function AdminLogoutButton({ icon }: { icon: React.ReactNode }) {
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    // Hard navigation — clears any client-side state and forces a fresh
    // server render, matching the pattern used across the member app's own
    // auth flows.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-500 transition hover:bg-blush-50 hover:text-primary"
    >
      {icon}
      Logout
    </button>
  );
}
