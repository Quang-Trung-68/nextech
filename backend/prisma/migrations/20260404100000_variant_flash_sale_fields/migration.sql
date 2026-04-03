-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "salePrice" DECIMAL(15,2),
ADD COLUMN     "saleExpiresAt" TIMESTAMP(3),
ADD COLUMN     "saleStock" INTEGER,
ADD COLUMN     "saleSoldCount" INTEGER NOT NULL DEFAULT 0;
