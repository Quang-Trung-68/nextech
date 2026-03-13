/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "stripeClientSecret" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripePaymentIntentId_key" ON "orders"("stripePaymentIntentId");
