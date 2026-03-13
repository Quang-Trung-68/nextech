const prisma = require('../utils/prisma');
const cartService = require('./cart.service');
const paymentService = require('./payment.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORDER_DETAIL_INCLUDE = {
  orderItems: {
    include: {
      product: {
        select: { id: true, name: true, price: true, images: true },
      },
    },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
};

// Status flow cứng: chỉ được đi theo chiều này
const STATUS_FLOW = {
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// ─── User: Tạo đơn hàng ───────────────────────────────────────────────────────

const createOrder = async (userId, shippingAddress, paymentMethod) => {
  const userCart = await cartService.getCart(userId);
  const cartItems = userCart.items;

  if (cartItems.length === 0) {
    throw createError('Giỏ hàng trống, không thể tạo đơn', 400);
  }

  let totalAmount = 0;

  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      throw createError(`Sản phẩm "${item.name}" không đủ hàng (còn ${item.stock})`, 400);
    }
    totalAmount += Number(item.price) * item.quantity;
  }

  // COD → PROCESSING ngay, STRIPE → PENDING chờ webhook
  const initialStatus = paymentMethod === 'COD' ? 'PROCESSING' : 'PENDING';

  // $transaction: tạo Order + cắt stock + xoá Cart
  const [order] = await prisma.$transaction([
    prisma.order.create({
      data: {
        userId,
        shippingAddress,
        paymentMethod,
        totalAmount,
        status: initialStatus,
        orderItems: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: ORDER_DETAIL_INCLUDE,
    }),
    ...cartItems.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    ),
    prisma.cartItem.deleteMany({ where: { cart: { userId } } }),
  ]);

  // COD: trả về luôn
  if (paymentMethod === 'COD') {
    return { order };
  }

  // STRIPE: tạo PaymentIntent sau transaction
  let finalAmount = Math.round(Number(totalAmount));
  if ((process.env.STRIPE_CURRENCY || 'vnd').toLowerCase() !== 'vnd') {
    finalAmount = Math.round(Number(totalAmount) * 100);
  }

  const paymentIntent = await paymentService.createPaymentIntent(
    finalAmount,
    process.env.STRIPE_CURRENCY || 'vnd',
    { orderId: order.id, userId }
  );

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
    },
    include: ORDER_DETAIL_INCLUDE,
  });

  return {
    order: { ...updatedOrder, clientSecret: paymentIntent.client_secret },
    clientSecret: paymentIntent.client_secret,
  };
};

// ─── User: Lịch sử đơn hàng (phân trang + filter) ───────────────────────────

const getMyOrders = async (userId, { status, page, limit }) => {
  const where = { userId };
  if (status) where.status = status;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, price: true, images: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── User + Admin: Chi tiết đơn hàng ─────────────────────────────────────────

const getOrderById = async (orderId, userId, role) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_DETAIL_INCLUDE,
  });

  if (!order) throw createError('Không tìm thấy đơn hàng', 404);

  if (order.userId !== userId && role !== 'ADMIN') {
    throw createError('Bạn không có quyền xem đơn hàng này', 403);
  }

  return order;
};

// ─── User: Huỷ đơn ───────────────────────────────────────────────────────────

const cancelOrder = async (orderId, userId, reason) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw createError('Không tìm thấy đơn hàng', 404);
  if (order.userId !== userId) throw createError('Bạn không có quyền huỷ đơn hàng này', 403);

  // CANCELLED/SHIPPED/DELIVERED đều bị block bởi guard này
  if (!['PENDING', 'PROCESSING'].includes(order.status)) {
    throw createError(
      `Không thể huỷ đơn ở trạng thái ${order.status}. Chỉ huỷ được khi PENDING hoặc PROCESSING`,
      400
    );
  }

  // Với Stripe đã PAID: không hoàn tiền tự động, ghi chú cần xử lý thủ công
  const requiresManualRefund =
    order.paymentMethod === 'STRIPE' && order.paymentStatus === 'PAID';

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      // Ghi chú vào shippingAddress (hoặc metadata nếu schema có) — đây là cách đơn giản
      // Trong production nên có field notes/cancelReason riêng trong schema
    },
    include: ORDER_DETAIL_INCLUDE,
  });

  return {
    order: updatedOrder,
    requiresManualRefund,
    cancelReason: reason,
    ...(requiresManualRefund && {
      refundNote:
        'Đơn đã thanh toán qua Stripe. Vui lòng liên hệ hỗ trợ để được hoàn tiền thủ công.',
    }),
  };
};

// ─── Admin: Danh sách tất cả đơn hàng ────────────────────────────────────────

const getAllOrders = async ({ status, paymentStatus, userId, sortBy, sortOrder, page, limit }) => {
  const where = {};
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (userId) where.userId = userId;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true, price: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─── Admin: Cập nhật trạng thái đơn ─────────────────────────────────────────

const adminUpdateOrderStatus = async (orderId, newStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw createError('Không tìm thấy đơn hàng', 404);

  if (order.status === 'CANCELLED') {
    throw createError('Không thể cập nhật đơn hàng đã bị huỷ', 400);
  }

  if (order.status === 'DELIVERED') {
    throw createError('Đơn hàng đã giao, không thể cập nhật thêm', 400);
  }

  // Enforce flow: chỉ được đi đúng chiều PROCESSING → SHIPPED → DELIVERED
  // PENDING không có trong STATUS_FLOW (đơn Stripe chưa thanh toán)
  const expectedNext = STATUS_FLOW[order.status];
  if (!expectedNext) {
    throw createError(
      `Đơn hàng đang ở trạng thái ${order.status}, không thể cập nhật theo flow Admin. Chỉ áp dụng cho đơn đang PROCESSING hoặc SHIPPED.`,
      400
    );
  }
  if (newStatus !== expectedNext) {
    throw createError(
      `Không hợp lệ: đơn đang ở ${order.status}, bước tiếp theo phải là ${expectedNext}`,
      400
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: ORDER_DETAIL_INCLUDE,
  });
};

// ─── Admin: Chi tiết đơn (bất kỳ) ────────────────────────────────────────────

const adminGetOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_DETAIL_INCLUDE,
  });

  if (!order) throw createError('Không tìm thấy đơn hàng', 404);
  return order;
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
};
