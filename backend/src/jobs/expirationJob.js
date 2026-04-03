const cron = require('node-cron');
const prisma = require('../utils/prisma');
const emailJob = require('./emailJob');
const notificationService = require('../services/notification.service');

// Chạy mỗi 1 phút
const expirationJob = cron.schedule('* * * * *', async () => {
  try {
    const expiredMinutes = 15;
    const expirationTime = new Date(Date.now() - expiredMinutes * 60 * 1000);

    // Tìm các đơn hàng PENDING + UNPAID (Thường là Stripe/SePay) đã quá hạn 15 phút
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        createdAt: {
          lt: expirationTime,
        },
      },
      include: {
        orderItems: true,
        user: true,
      },
    });

    if (expiredOrders.length === 0) {
      return;
    }

    console.log(`[ExpirationJob] Found ${expiredOrders.length} expired orders. Cancelling...`);

    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
          },
        });

        // Hoàn trả stock cho sản phẩm / biến thể
        for (const item of order.orderItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
              },
            });
          }
        }
      });

      console.log(`[ExpirationJob] Cancelled order ${order.id} due to timeout.`);

      // Gửi in-app notification
      try {
        await notificationService.createAndSend(
          order.userId,
          'order_status_changed',
          'Huỷ đơn hàng tự động',
          `Đơn hàng #${order.id} của bạn đã bị huỷ tự động do quá ${expiredMinutes} phút không thanh toán thành công.`,
          { orderId: order.id, newStatus: 'CANCELLED' }
        );
      } catch (err) {
        console.error('[Notification Error] Failed to send auto-cancel notification:', err);
      }

      // Gửi email báo huỷ
      if (order.user?.email) {
        emailJob.dispatchOrderCancelledEmail(order.user.email, {
          user: { name: order.user.name },
          order: {
            id: order.id,
            items: order.orderItems.map(oi => ({ name: oi.productId, quantity: oi.quantity, price: oi.price, originalPrice: oi.originalPrice })),
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount,
            coupon: order.coupon,
          },
          cancelReason: `Quá thời gian thanh toán (${expiredMinutes} phút)`,
          requiresManualRefund: false,
        });
      }
    }
  } catch (err) {
    console.error('[ExpirationJob] Error running expiration job:', err);
  }
});

module.exports = expirationJob;
