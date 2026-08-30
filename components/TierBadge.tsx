const TIER_STYLES: Record<string, string> = {
  FREE: "bg-tier-free/10 text-tier-free border-tier-free/30",
  BASIC: "bg-tier-basic/10 text-tier-basic border-tier-basic/30",
  SILVER: "bg-tier-silver/10 text-tier-silver border-tier-silver/30",
  GOLD: "bg-tier-gold/10 text-tier-gold border-tier-gold/30",
  PREMIUM: "bg-tier-premium/10 text-tier-premium border-tier-premium/30",
};

// BASIC/SILVER/GOLD/PREMIUM are used as brand-style tier names in every
// language (unchanged); only FREE has a real word to translate.
export default function TierBadge({
  tier,
  freeLabel = "Bure",
  className = "",
}: {
  tier: string;
  freeLabel?: string;
  className?: string;
}) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.FREE;
  const label = tier === "FREE" ? freeLabel.toUpperCase() : tier;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${style} ${className}`}
    >
      {label}
    </span>
  );
}
