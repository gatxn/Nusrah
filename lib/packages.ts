import type { Package } from "@prisma/client";

export type SerializedPackage = {
  id: string;
  tier: string;
  name: string;
  priceTzs: number;
  durationDays: number;
  tagline: string;
  features: string[];
};

export function serializePackage(pkg: Package): SerializedPackage {
  return {
    id: pkg.id,
    tier: pkg.tier,
    name: pkg.name,
    priceTzs: pkg.priceTzs,
    durationDays: pkg.durationDays,
    tagline: pkg.tagline,
    features: JSON.parse(pkg.features) as string[],
  };
}
