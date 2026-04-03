const cron = require('node-cron');
const prisma = require('../utils/prisma');
const notificationService = require('../services/notification.service');
const inventoryService = require('../services/inventory.service');

// Mỗi giờ — kiểm tra tồn serial IN_STOCK so với ngưỡng
const lowStockJob = cron.schedule('0 * * * *', async () => {
  try {
    const { alerts } = await inventoryService.getLowStockReport();
    if (!alerts.length) return;

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    if (!admins.length) return;

    for (const a of alerts) {
      const label = a.sku ? `${a.productName} (${a.sku})` : a.productName;
      const msg = `"${label}" còn ${a.inStockSerialCount} đơn vị serial trong kho (ngưỡng: ${a.threshold})`;
      for (const admin of admins) {
        try {
          await notificationService.createAndSend(
            admin.id,
            'low_stock',
            'Cảnh báo tồn kho thấp',
            msg,
            {
              productId: a.productId,
              variantId: a.variantId,
              productName: a.productName,
              inStockSerialCount: a.inStockSerialCount,
              threshold: a.threshold,
            }
          );
        } catch (err) {
          console.error('[LowStockJob] notification error:', err);
        }
      }
    }
  } catch (err) {
    console.error('[LowStockJob] Error:', err);
  }
});

module.exports = lowStockJob;
