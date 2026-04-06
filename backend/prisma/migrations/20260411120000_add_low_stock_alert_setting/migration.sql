-- Bật/tắt thông báo "Cảnh báo tồn kho thấp" (job lowStockJob) — tách khỏi cảnh báo đơn hàng thấp
ALTER TABLE "shop_settings" ADD COLUMN "lowStockAlertEnabled" BOOLEAN NOT NULL DEFAULT true;
