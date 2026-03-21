const prisma = require('../utils/prisma');
const cartService = require('./cart.service');
const paymentService = require('./payment.service');
const emailJob = require('../jobs/emailJob');
const { getFinalPrice, getDiscountPercentFromSnapshot, addPriceFields } = require('../utils/price');
const { AppError, NotFoundError, ConflictError, ForbiddenError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORDER_DETAIL_INCLUDE = {
  orderItems: {
    include: {
      product: {
        select: { id: true, name: true, price: true, salePrice: true, images: true },
      },
    },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
};

/**
 * Add discountPercent (computed from snapshot) to each orderItem for display.
 */
const _addOrderItemDiscounts = (order) => {
  if (!order || !order.orderItems) return order;
  return {
    ...order,
    orderItems: order.orderItems.map((item) => ({
      ...item,
      discountPercent: getDiscountPercentFromSnapshot(item.price, item.originalPrice),
    })),
  };
};

const STATUS_FLOW = {
  PENDING: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

// ─── User: Tạo đơn hàng ───────────────────────────────────────────────────────

const createOrder = async (userId, shippingAddress, paymentMethod) => {
  const userCart = await cartService.getCart(userId);
  const cartItems = userCart.items;

  if (cartItems.length === 0) {
    throw new AppError('Cart is empty, cannot create order', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }

  let totalAmount = 0;

  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      throw new ConflictError(`Product "${item.name}" does not have enough stock (remaining ${item.stock})`, ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK);
    }
    // Dùng finalPrice từ cart (đã được cart service tính) để đảm bảo nhất quán
    totalAmount += Number(item.finalPrice) * item.quantity;
  }

  // COD,STRIPE → PENDING chờ xử lý
  const initialStatus = 'PENDING';

  // $transaction: tạo Order + cắt stock + xoá Cart (nếu không phải STRIPE)
  const transactionItems = [
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
            // price = finalPrice (giá thực khách trả, có thể là salePrice)
            price: item.finalPrice,
            // originalPrice = snapshot giá gốc tại thời điểm mua
            originalPrice: parseFloat(item.price),
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
    )
  ];

  if (paymentMethod === 'COD') {
    transactionItems.push(prisma.cartItem.deleteMany({ where: { cart: { userId } } }));
  }

  const [order] = await prisma.$transaction(transactionItems);
  const orderWithDiscounts = _addOrderItemDiscounts(order);

  // Bổ sung lookup thông tin User để Email context lấy được tên truy cập và Email
  if (!orderWithDiscounts.user) {
    const userForMail = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    orderWithDiscounts.user = userForMail;
  }

  // COD: trả về luôn
  if (paymentMethod === 'COD') {
    // Fire-and-forget: gửi email xác nhận không block luồng trả response
    emailJob.dispatchOrderConfirmationEmail(orderWithDiscounts.user.email, { name: orderWithDiscounts.user.name, order: orderWithDiscounts });
    return { order: orderWithDiscounts };
  }

  // STRIPE currency: giá lưu trong DB là VND.
  // Stripe giới hạn VND tối đa ₫99,999,999, nên chuyển sang USD cents.
  // Tỉ giá tạm thời: 1 USD = 25,000 VND (chỉ dùng cho test/dev)
  const VND_TO_USD_RATE = 25000;
  const currency = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

  // Task 4: Payment Intent dùng totalAmount đã giảm giá (tính từ finalPrice)
  let finalAmount;
  if (currency === 'vnd') {
    finalAmount = Math.round(Number(totalAmount));
  } else {
    finalAmount = Math.round((Number(totalAmount) / VND_TO_USD_RATE) * 100);
  }

  const paymentIntent = await paymentService.createPaymentIntent(
    finalAmount,
    currency,
    { orderId: orderWithDiscounts.id, userId }
  );

  const updatedOrder = await prisma.order.update({
    where: { id: orderWithDiscounts.id },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.client_secret,
    },
    include: ORDER_DETAIL_INCLUDE,
  });

  const updatedOrderWithDiscounts = _addOrderItemDiscounts(updatedOrder);

  return {
    order: { ...updatedOrderWithDiscounts, clientSecret: paymentIntent.client_secret },
    clientSecret: paymentIntent.client_secret,
  };
};

// ─── User: Lịch sử đơn hàng (phân trang + filter) ───────────────────────────

const getMyOrders = async (userId, { status, search, page, limit }) => {
  const where = { userId };
  if (status) where.status = status;
  if (search) where.id = { contains: search };

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
            product: { select: { id: true, name: true, price: true, salePrice: true, images: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(_addOrderItemDiscounts),
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

  if (!order) throw new NotFoundError('Order');

  if (order.userId !== userId && role !== 'ADMIN') {
    throw new ForbiddenError('You do not have permission to view this order');
  }

  return _addOrderItemDiscounts(order);
};

// ─── User: Huỷ đơn ───────────────────────────────────────────────────────────

const cancelOrder = async (orderId, userId, reason) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw new NotFoundError('Order');
  if (order.userId !== userId) throw new ForbiddenError('You do not have permission to cancel this order');

  // CANCELLED/SHIPPED/DELIVERED đều bị block bởi guard này
  if (!['PENDING', 'PROCESSING'].includes(order.status)) {
    throw new AppError(
      `Cannot cancel order in ${order.status} status. Only PENDING or PROCESSING orders can be cancelled.`,
      400,
      ERROR_CODES.ORDER.ORDER_CANNOT_BE_CANCELLED
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
        'Order was paid via Stripe. Please contact support for a manual refund.',
    }),
  };
};

// ─── Admin: Danh sách tất cả đơn hàng ────────────────────────────────────────

const getAllOrders = async ({ status, paymentStatus, userId, sortBy, sortOrder, page, limit, search }) => {
  const where = {};
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

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
            product: { select: { id: true, name: true, price: true, salePrice: true } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(_addOrderItemDiscounts),
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

  if (!order) throw new NotFoundError('Order');

  if (order.status === 'CANCELLED') {
    throw new AppError('Cannot update a cancelled order', 400, ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION);
  }

  if (order.status === 'DELIVERED') {
    throw new AppError('Order is already delivered, cannot update further', 400, ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION);
  }

  // Enforce flow: chỉ được đi đúng chiều PROCESSING → SHIPPED → DELIVERED
  // PENDING không có trong STATUS_FLOW (đơn Stripe chưa thanh toán)
  const expectedNext = STATUS_FLOW[order.status];
  if (!expectedNext) {
    throw new AppError(
      `Order is in ${order.status} status and cannot be updated via Admin flow. Only applies to PENDING, PROCESSING or SHIPPED.`,
      400,
      ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION
    );
  }
  if (newStatus !== expectedNext) {
    throw new AppError(
      `Invalid transition: order is in ${order.status}, next step must be ${expectedNext}`,
      400,
      ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: ORDER_DETAIL_INCLUDE,
  });

  if (newStatus === 'PROCESSING') {
    emailJob.dispatchOrderProcessingEmail(updatedOrder.user.email, {
      user: { name: updatedOrder.user.name },
      order: {
        id: updatedOrder.id,
        items: updatedOrder.orderItems.map(oi => ({ name: oi.product.name, quantity: oi.quantity, price: oi.price, originalPrice: oi.originalPrice })),
        totalAmount: updatedOrder.totalAmount,
        shippingAddress: updatedOrder.shippingAddress
      }
    });
  } else if (newStatus === 'SHIPPED') {
    emailJob.dispatchOrderShippedEmail(updatedOrder.user.email, {
      user: { name: updatedOrder.user.name },
      order: {
        id: updatedOrder.id,
        items: updatedOrder.orderItems.map(oi => ({ name: oi.product.name, quantity: oi.quantity, price: oi.price, originalPrice: oi.originalPrice })),
        totalAmount: updatedOrder.totalAmount,
        shippingAddress: updatedOrder.shippingAddress,
        trackingUrl: updatedOrder.trackingUrl ?? null
      }
    });
  } else if (newStatus === 'DELIVERED') {
    emailJob.dispatchOrderDeliveredEmail(updatedOrder.user.email, {
      user: { name: updatedOrder.user.name },
      order: {
        id: updatedOrder.id,
        items: updatedOrder.orderItems.map(oi => ({ name: oi.product.name, quantity: oi.quantity, price: oi.price, originalPrice: oi.originalPrice })),
        totalAmount: updatedOrder.totalAmount,
        shippingAddress: updatedOrder.shippingAddress,
        trackingUrl: updatedOrder.trackingUrl ?? null
      }
    });
  }

  return updatedOrder;
};

// ─── Admin: Chi tiết đơn (bất kỳ) ────────────────────────────────────────────

const adminGetOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_DETAIL_INCLUDE,
  });

  if (!order) throw new NotFoundError('Order');
  return _addOrderItemDiscounts(order);
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
