-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "debtAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_debtAccountId_fkey" FOREIGN KEY ("debtAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
