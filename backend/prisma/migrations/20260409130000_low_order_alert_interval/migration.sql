-- CreateEnum
CREATE TYPE "LowOrderAlertInterval" AS ENUM ('HOURLY', 'DAILY', 'MONTHLY');

-- AlterTable
ALTER TABLE "shop_settings" ADD COLUMN "lowOrderAlertInterval" "LowOrderAlertInterval" NOT NULL DEFAULT 'DAILY';
ALTER TABLE "shop_settings" ADD COLUMN "lowOrderAlertLastPeriodKey" TEXT;
