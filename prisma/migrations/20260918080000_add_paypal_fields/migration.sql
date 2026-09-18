-- AlterTable
ALTER TABLE "Package" ADD COLUMN "priceUsdCents" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'TZS';
ALTER TABLE "Order" ADD COLUMN "amountUsdCents" INTEGER;

-- Seed small, safe-to-test USD prices mirroring the same numeric pattern as
-- the existing TZS test prices (50/100/150/200) — adjustable later via the
-- admin Memberships page. FREE stays NULL (no payment, no PayPal option).
UPDATE "Package" SET "priceUsdCents" = 50 WHERE "tier" = 'BASIC';
UPDATE "Package" SET "priceUsdCents" = 100 WHERE "tier" = 'SILVER';
UPDATE "Package" SET "priceUsdCents" = 150 WHERE "tier" = 'GOLD';
UPDATE "Package" SET "priceUsdCents" = 200 WHERE "tier" = 'PREMIUM';
