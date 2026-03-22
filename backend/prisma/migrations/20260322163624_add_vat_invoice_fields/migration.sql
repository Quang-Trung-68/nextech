/*
  Warnings:

  - You are about to drop the `InvoiceItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";

-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "vatRate" DECIMAL(4,3) NOT NULL DEFAULT 0.10;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "vatBuyerCompany" TEXT,
ADD COLUMN     "vatBuyerCompanyAddress" TEXT,
ADD COLUMN     "vatBuyerTaxCode" TEXT,
ADD COLUMN     "vatInvoiceRequested" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "InvoiceItem";

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,0) NOT NULL,
    "totalPrice" DECIMAL(12,0) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
