-- CreateEnum
CREATE TYPE "VatBuyerType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "vatBuyerAddress" TEXT,
ADD COLUMN     "vatBuyerEmail" TEXT,
ADD COLUMN     "vatBuyerName" TEXT,
ADD COLUMN     "vatBuyerType" "VatBuyerType";
