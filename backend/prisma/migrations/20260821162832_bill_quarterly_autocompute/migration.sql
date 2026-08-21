-- AlterEnum
ALTER TYPE "BillFrequency" ADD VALUE 'QUARTERLY';

-- AlterTable
ALTER TABLE "bills" ADD COLUMN     "autoComputeRate" DECIMAL(5,4);
