-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';

-- Backfill: preserve any prior manual review already recorded via the
-- legacy isVerified boolean.
UPDATE "Profile" SET "verificationStatus" = 'VERIFIED' WHERE "isVerified" = true;
