-- Carousel trang chủ + link thương hiệu
ALTER TABLE "brands" ADD COLUMN "carouselOrder" INTEGER;
ALTER TABLE "brands" ADD COLUMN "websiteUrl" TEXT;
ALTER TABLE "brands" ADD COLUMN "carouselCategorySlug" TEXT;

CREATE INDEX "brands_carouselOrder_idx" ON "brands"("carouselOrder");
