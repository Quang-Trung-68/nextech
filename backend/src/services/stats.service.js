const prisma = require('../utils/prisma');

// Helper: tính thời điểm bắt đầu của period
const getPeriodStart = (period) => {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week': {
      const day = now.getDay(); // 0=Sun
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case 'month':
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
};

const getOverviewStats = async (period = 'month') => {
  const periodStart = getPeriodStart(period);

  const [
    // 1. Tổng doanh thu trong period (chỉ PAID)
    revenueResult,
    // 2. Đơn theo status (toàn thời gian)
    ordersByStatus,
    // 3. Top 5 sản phẩm bán chạy (toàn thời gian, không tính CANCELLED)
    topProducts,
    // 4. Sản phẩm tồn kho thấp
    lowStockProducts,
    // 5. User mới trong period
    newUsersCount,
    // 6. Doanh thu COD vs Stripe trong period
    revenueByMethod,
    // 7. Tổng đơn trong period (để tính tỉ lệ huỷ)
    totalOrdersInPeriod,
    cancelledOrdersInPeriod,
  ] = await Promise.all([
    // 1. Revenue trong period
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: periodStart } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    // 2. Group by status (toàn thời gian) — dùng groupBy
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    }),

    // 3. Top 5 bán chạy: aggregate OrderItem, exclude CANCELLED orders
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { status: { not: 'CANCELLED' } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),

    // 4. Tồn kho thấp (<= 10)
    prisma.product.findMany({
      where: { stock: { lte: 10 } },
      select: { id: true, name: true, stock: true, category: true },
      orderBy: { stock: 'asc' },
    }),

    // 5. User mới trong period
    prisma.user.count({ where: { createdAt: { gte: periodStart } } }),

    // 6. Doanh thu theo paymentMethod trong period (chỉ PAID)
    prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { paymentStatus: 'PAID', createdAt: { gte: periodStart } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),

    // 7. Tổng đơn trong period
    prisma.order.count({ where: { createdAt: { gte: periodStart } } }),

    // 8. Đơn bị huỷ trong period
    prisma.order.count({ where: { status: 'CANCELLED', createdAt: { gte: periodStart } } }),
  ]);

  // Gắn thêm thông tin product cho top 5
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, category: true, price: true, images: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const topProductsWithInfo = topProducts.map((item) => ({
    product: productMap[item.productId] || null,
    totalSold: item._sum.quantity,
  }));

  // Format đơn theo status thành object
  const orderStatusMap = Object.fromEntries(
    ordersByStatus.map((s) => [s.status, s._count.id])
  );
  const cancellationRate =
    totalOrdersInPeriod > 0
      ? ((cancelledOrdersInPeriod / totalOrdersInPeriod) * 100).toFixed(2)
      : '0.00';

  return {
    period,
    periodStart,
    revenue: {
      total: revenueResult._sum.totalAmount || 0,
      orderCount: revenueResult._count.id,
    },
    orders: {
      byStatus: {
        PENDING: orderStatusMap.PENDING || 0,
        PROCESSING: orderStatusMap.PROCESSING || 0,
        SHIPPED: orderStatusMap.SHIPPED || 0,
        DELIVERED: orderStatusMap.DELIVERED || 0,
        CANCELLED: orderStatusMap.CANCELLED || 0,
      },
      cancellationRate: `${cancellationRate}%`,
      totalInPeriod: totalOrdersInPeriod,
      cancelledInPeriod: cancelledOrdersInPeriod,
    },
    topProducts: topProductsWithInfo,
    lowStockProducts,
    newUsers: newUsersCount,
    revenueByMethod: revenueByMethod.map((r) => ({
      method: r.paymentMethod,
      total: r._sum.totalAmount || 0,
      orderCount: r._count.id,
    })),
  };
};

module.exports = { getOverviewStats };
