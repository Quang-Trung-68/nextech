-- AlterTable
ALTER TABLE "products" ADD COLUMN     "saleExpiresAt" TIMESTAMP(3),
ADD COLUMN     "saleSoldCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "saleStock" INTEGER;
