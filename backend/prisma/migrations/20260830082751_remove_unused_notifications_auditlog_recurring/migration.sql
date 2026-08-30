-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "isRecurring",
DROP COLUMN "recurringRule";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "notifications";

-- DropEnum
DROP TYPE "NotificationType";
