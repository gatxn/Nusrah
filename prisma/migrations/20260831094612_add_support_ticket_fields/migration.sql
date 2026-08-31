-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "attachmentEnc" BYTEA,
ADD COLUMN     "attachmentMimeType" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "ticketSeq" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ContactMessage_ticketSeq_key" ON "ContactMessage"("ticketSeq");
