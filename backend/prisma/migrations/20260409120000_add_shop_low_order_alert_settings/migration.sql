-- AlterTable
ALTER TABLE "shop_settings" ADD COLUMN "lowOrderAlertEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "shop_settings" ADD COLUMN "lowOrderAlertThreshold" INTEGER NOT NULL DEFAULT 5;
