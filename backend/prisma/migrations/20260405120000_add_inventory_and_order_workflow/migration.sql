-- CreateEnum
CREATE TYPE "SerialStatus" AS ENUM ('IN_STOCK', 'RESERVED', 'SOLD', 'RETURNED');

-- Migrate OrderStatus: replace enum values
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED', 'CANCELLED', 'RETURNED');

ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING (
  CASE "status"::text
    WHEN 'PENDING' THEN 'PENDING'::"OrderStatus_new"
    WHEN 'PROCESSING' THEN 'CONFIRMED'::"OrderStatus_new"
    WHEN 'SHIPPED' THEN 'SHIPPING'::"OrderStatus_new"
    WHEN 'DELIVERED' THEN 'COMPLETED'::"OrderStatus_new"
    WHEN 'CANCELLED' THEN 'CANCELLED'::"OrderStatus_new"
    ELSE 'PENDING'::"OrderStatus_new"
  END
);
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"OrderStatus_new";

DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

-- AlterTable products
ALTER TABLE "products" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

-- AlterTable product_variants
ALTER TABLE "product_variants" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

-- AlterTable orders — shipping fields
ALTER TABLE "orders" ADD COLUMN "trackingCode" TEXT;
ALTER TABLE "orders" ADD COLUMN "trackingUrl" TEXT;
ALTER TABLE "orders" ADD COLUMN "carrierName" TEXT;

-- AlterTable order_item
ALTER TABLE "order_item" ADD COLUMN "serialUnitId" TEXT;
ALTER TABLE "order_item" ADD COLUMN "assignedAt" TIMESTAMP(3);

-- CreateTable suppliers
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable stock_imports
CREATE TABLE "stock_imports" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "importedBy" TEXT NOT NULL,
    "importDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unitCost" DECIMAL(15,2),
    "notes" TEXT,
    "totalUnits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable serial_units
CREATE TABLE "serial_units" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "stockImportId" TEXT NOT NULL,
    "status" "SerialStatus" NOT NULL DEFAULT 'IN_STOCK',
    "reservedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "serial_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "serial_units_serial_key" ON "serial_units"("serial");

-- CreateIndex
CREATE INDEX "serial_units_productId_status_idx" ON "serial_units"("productId", "status");

-- CreateIndex
CREATE INDEX "serial_units_variantId_status_idx" ON "serial_units"("variantId", "status");

-- CreateIndex
CREATE INDEX "stock_imports_productId_idx" ON "stock_imports"("productId");

-- CreateIndex
CREATE INDEX "stock_imports_supplierId_idx" ON "stock_imports"("supplierId");

-- AddForeignKey
ALTER TABLE "stock_imports" ADD CONSTRAINT "stock_imports_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_imports" ADD CONSTRAINT "stock_imports_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_imports" ADD CONSTRAINT "stock_imports_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_imports" ADD CONSTRAINT "stock_imports_importedBy_fkey" FOREIGN KEY ("importedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_stockImportId_fkey" FOREIGN KEY ("stockImportId") REFERENCES "stock_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_units" ADD CONSTRAINT "serial_units_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey order_item -> serial_units
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_serialUnitId_fkey" FOREIGN KEY ("serialUnitId") REFERENCES "serial_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "order_item_serialUnitId_key" ON "order_item"("serialUnitId");
