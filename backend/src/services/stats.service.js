const prisma = require('../utils/prisma');
const inventoryService = require('./inventory.service');

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
  
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

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
    
    // NEW: All-time metrics for Dashboard Cards
    totalProducts,
    totalUsersAllTime,
    totalOrdersAllTime,
    totalRevenueAllTimeResult,

    // NEW: Latest 5 orders for Dashboard Table
    latestOrders,

    // NEW: Yearly paid orders for Monthly Revenue Chart
    yearlyPaidOrders,

    // Serial IN_STOCK count (kho theo IMEI)
    serialInStockCount,
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

    // 9. Total Products
    prisma.product.count(),

    // 10. Total Users
    prisma.user.count(),

    // 11. Total Orders
    prisma.order.count(),

    // 12. Total Revenue (PAID)
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: { totalAmount: true },
    }),

    // 13. Latest 5 Orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),

    // 14. Yearly Paid Orders
    prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    }),

    // 15. Serial units còn trong kho (IN_STOCK)
    prisma.serialUnit.count({ where: { status: 'IN_STOCK' } }),
  ]);

  const lowStockReport = await inventoryService.getLowStockReport();

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

  // Process monthly revenue
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    month: `T${i + 1}`,
    revenue: 0,
  }));

  yearlyPaidOrders.forEach((order) => {
    const monthIndex = new Date(order.createdAt).getMonth(); // 0-based
    if (order.totalAmount) {
      monthlyRevenue[monthIndex].revenue += Number(order.totalAmount);
    }
  });

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
        CONFIRMED: orderStatusMap.CONFIRMED || 0,
        PACKING: orderStatusMap.PACKING || 0,
        SHIPPING: orderStatusMap.SHIPPING || 0,
        COMPLETED: orderStatusMap.COMPLETED || 0,
        CANCELLED: orderStatusMap.CANCELLED || 0,
        RETURNED: orderStatusMap.RETURNED || 0,
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
    // NEW METRICS
    totalProducts,
    totalUsersAllTime,
    totalOrdersAllTime,
    totalRevenueAllTime: totalRevenueAllTimeResult._sum.totalAmount || 0,
    latestOrders,
    monthlyRevenue,
    inventory: {
      serialInStockCount,
      lowStockAlertCount: lowStockReport.alerts.length,
    },
  };
};

const getRevenueStats = async (year, monthStr) => {
  const targetYear = parseInt(year);
  
  if (monthStr === 'all' || monthStr === 'All' || monthStr === 'Tất cả') {
    // Trả về 12 tháng
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
    
    const yearlyPaidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startOfYear, lte: endOfYear },
      },
      select: { totalAmount: true, createdAt: true },
    });
    
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: `T${i + 1}`,
      revenue: 0,
    }));

    yearlyPaidOrders.forEach((order) => {
      const monthIndex = new Date(order.createdAt).getMonth();
      if (order.totalAmount) {
        monthlyRevenue[monthIndex].revenue += Number(order.totalAmount);
      }
    });
    
    return monthlyRevenue;
  } else {
    // Trả về theo ngày trong tháng
    const targetMonth = parseInt(monthStr); // 1 - 12
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    const monthlyPaidOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { totalAmount: true, createdAt: true },
    });
    
    const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => ({
      month: `N${i + 1}`,
      revenue: 0,
    }));
    
    monthlyPaidOrders.forEach((order) => {
      const dayIndex = new Date(order.createdAt).getDate() - 1;
      if (order.totalAmount) {
        dailyRevenue[dayIndex].revenue += Number(order.totalAmount);
      }
    });
    
    return dailyRevenue;
  }
};

module.exports = { getOverviewStats, getRevenueStats };
