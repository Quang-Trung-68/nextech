-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- AlterTable
ALTER TABLE "products" DROP COLUMN IF EXISTS "brand";

ALTER TABLE "products" ADD COLUMN "slug" TEXT;
ALTER TABLE "products" ADD COLUMN "brandId" TEXT;

UPDATE "products" SET "slug" = "id" WHERE "slug" IS NULL;

ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

CREATE INDEX "products_brandId_idx" ON "products"("brandId");

ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
