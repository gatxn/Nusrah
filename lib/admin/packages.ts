import { prisma } from "@/lib/db";
import { serializePackage, type SerializedPackage } from "@/lib/packages";
import { TIER_RANK, isTier } from "@/lib/tiers";

export async function listAdminPackages(): Promise<SerializedPackage[]> {
  const packages = await prisma.package.findMany();
  const sorted = packages.sort((a, b) => {
    const rankA = isTier(a.tier) ? TIER_RANK[a.tier] : 0;
    const rankB = isTier(b.tier) ? TIER_RANK[b.tier] : 0;
    return rankA - rankB;
  });
  return sorted.map(serializePackage);
}

export type UpdatePackageInput = {
  priceTzs: number;
  priceUsdCents: number | null;
  durationDays: number;
  tagline: string;
  features: string[];
};

export async function updatePackage(packageId: string, input: UpdatePackageInput): Promise<boolean> {
  const result = await prisma.package.updateMany({
    where: { id: packageId },
    data: {
      priceTzs: input.priceTzs,
      priceUsdCents: input.priceUsdCents,
      durationDays: input.durationDays,
      tagline: input.tagline,
      features: JSON.stringify(input.features),
    },
  });
  return result.count === 1;
}
