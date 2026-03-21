-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "buyerAddress" TEXT NOT NULL,
    "buyerCompany" TEXT,
    "buyerTaxCode" TEXT,
    "sellerName" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "sellerTaxCode" TEXT NOT NULL,
    "subtotal" DECIMAL(12,0) NOT NULL,
    "discountAmount" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "vatRate" DECIMAL(4,3) NOT NULL DEFAULT 0.10,
    "vatAmount" DECIMAL(12,0) NOT NULL,
    "totalAmount" DECIMAL(12,0) NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,0) NOT NULL,
    "totalPrice" DECIMAL(12,0) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "shopName" TEXT NOT NULL DEFAULT 'NexTech',
    "shopAddress" TEXT NOT NULL DEFAULT '',
    "taxCode" TEXT NOT NULL DEFAULT '',
    "bankAccount" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
