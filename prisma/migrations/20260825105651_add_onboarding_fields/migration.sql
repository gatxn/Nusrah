-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "country" TEXT,
ADD COLUMN     "intentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "photoEnc" BYTEA,
ADD COLUMN     "photoMimeType" TEXT,
ADD COLUMN     "photoUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "region" TEXT;
