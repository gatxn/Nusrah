import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializePackage } from "@/lib/packages";
import { TIER_RANK, isTier } from "@/lib/tiers";

export async function GET() {
  const packages = await prisma.package.findMany();
  const sorted = packages.sort((a, b) => {
    const rankA = isTier(a.tier) ? TIER_RANK[a.tier] : 0;
    const rankB = isTier(b.tier) ? TIER_RANK[b.tier] : 0;
    return rankA - rankB;
  });
  return NextResponse.json({ packages: sorted.map(serializePackage) });
}
