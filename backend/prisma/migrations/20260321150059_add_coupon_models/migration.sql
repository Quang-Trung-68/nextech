-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "couponId" INTEGER,
ADD COLUMN     "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "coupons" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponDiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "maxDiscountAmount" DOUBLE PRECISION,
    "minOrderAmount" DOUBLE PRECISION NOT NULL,
    "maxUsage" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" SERIAL NOT NULL,
    "couponId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_orderId_key" ON "coupon_usages"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_couponId_userId_key" ON "coupon_usages"("couponId", "userId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
