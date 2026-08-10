-- AlterTable
ALTER TABLE "savings_goals" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "targetAmount" DROP NOT NULL;
