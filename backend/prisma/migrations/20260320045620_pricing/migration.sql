/*
  Warnings:

  - You are about to drop the column `discountPercent` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "originalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "discountPercent",
ADD COLUMN     "salePrice" DECIMAL(15,2);
