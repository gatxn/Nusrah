import Link from "next/link";

export default function WanachamaTabs({ active }: { active: "browse" | "favorites" }) {
  const tabClass = (isActive: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${
      isActive ? "bg-primary text-white" : "text-neutral-600 hover:bg-blush-50"
    }`;

  return (
    <div className="mt-4 flex gap-2">
      <Link href="/wanachama" className={tabClass(active === "browse")}>
        Wanachama
      </Link>
      <Link href="/wanachama/vipendwa" className={tabClass(active === "favorites")}>
        Ninaowapenda
      </Link>
    </div>
  );
}
