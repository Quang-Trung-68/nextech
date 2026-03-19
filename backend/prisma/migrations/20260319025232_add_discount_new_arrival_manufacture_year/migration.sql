-- AlterTable
ALTER TABLE "products" ADD COLUMN     "discountPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isNewArrival" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "manufactureYear" INTEGER;
