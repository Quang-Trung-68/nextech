const prisma = require('../utils/prisma');
const cartService = require('./cart.service');
const paymentService = require('./payment.service');
const emailJob = require('../jobs/emailJob');
const { getFinalPrice, getDiscountPercentFromSnapshot, addPriceFields } = require('../utils/price');
const { AppError, NotFoundError, ConflictError, ForbiddenError } = require('../errors/AppError');
const { validateCoupon } = require('./coupon.service');
const ERROR_CODES = require('../errors/errorCodes');
const { isSaleActive } = require('../utils/saleUtils');
const notificationService = require('./notification.service');

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
  coupon: true,
  invoice: true,
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

const createOrder = async (userId, shippingAddress, paymentMethod, couponCode, orderData) => {
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

  // ─── Coupon logic ────────────────────────────────────────────────────────
  let discountAmount = 0;
  let appliedCouponId = null;

  if (couponCode) {
    // Re-validate phía server — không tin dữ liệu từ client
    const { coupon, discountAmount: calculated } = await validateCoupon({
      code: couponCode,
      userId,
      orderAmount: totalAmount,
    });
    discountAmount = calculated;
    appliedCouponId = coupon.id;
  }

  // finalAmount = tổng sau khi trừ coupon, tối thiểu = 0
  const finalAmount = Math.max(totalAmount - discountAmount, 0);

  // COD,STRIPE → PENDING chờ xử lý
  const initialStatus = 'PENDING';

  // $transaction: tạo Order + tạo Invoice + cắt stock + xoá Cart (nếu COD)
  const order = await prisma.$transaction(async (tx) => {
    const orderItemsData = [];

    for (const item of cartItems) {
      // STEP A
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundError('Product');

      // STEP B
      const saleActive = isSaleActive(product);
      const effectivePrice = saleActive ? product.salePrice : product.price;

      // STEP C
      if (saleActive && product.saleStock != null) {
        const updated = await tx.product.updateMany({
          where: {
            id: product.id,
            saleSoldCount: { lt: product.saleStock }
          },
          data: { saleSoldCount: { increment: item.quantity } }
        });

        if (updated.count === 0) {
          throw new ConflictError('Sản phẩm đã hết suất giảm giá. Vui lòng đặt lại với giá gốc.', 'SALE_SOLD_OUT');
        }
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      // STEP D
      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        price: effectivePrice,
        originalPrice: parseFloat(product.price),
      });
    }

    const createdOrder = await tx.order.create({
      data: {
        userId,
        shippingAddress,
        paymentMethod,
        totalAmount: finalAmount,
        discountAmount,
        couponId: appliedCouponId,
        status: initialStatus,
        vatInvoiceRequested: orderData?.vatInvoiceRequested || false,
        vatBuyerType: orderData?.vatBuyerType,
        vatBuyerName: orderData?.vatBuyerName,
        vatBuyerAddress: orderData?.vatBuyerAddress,
        vatBuyerEmail: orderData?.vatBuyerEmail,
        vatBuyerCompany: orderData?.vatBuyerCompany,
        vatBuyerTaxCode: orderData?.vatBuyerTaxCode,
        vatBuyerCompanyAddress: orderData?.vatBuyerCompanyAddress,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    // Xóa cart items nếu là COD
    if (paymentMethod === 'COD') {
      await tx.cartItem.deleteMany({ where: { cart: { userId } } });
    }

    return createdOrder;
  });

  if (orderData?.vatInvoiceRequested) {
    try {
      const { createDraftInvoice } = require('./invoice.service');
      await createDraftInvoice(order.id);
    } catch (err) {
      console.error(`[Invoice] Failed to create draft for order ${order.id}:`, err);
    }
  }

  // Coupon side-effects sau khi Order đã được tạo thành công.
  // Thực hiện trong transaction riêng ngay sau để đảm bảo atomicity
  if (appliedCouponId) {
    await prisma.$transaction([
      prisma.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.couponUsage.create({
        data: { couponId: appliedCouponId, userId, orderId: order.id },
      }),
    ]);
  }

  const orderWithDiscounts = _addOrderItemDiscounts(order);

  // Bổ sung lookup thông tin User để Email context lấy được tên truy cập và Email
  if (!orderWithDiscounts.user) {
    const userForMail = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    orderWithDiscounts.user = userForMail;
  }

  Promise.resolve().then(async () => {
    try {
      // Thông báo cho User vừa đặt hàng
      await notificationService.createAndSend(
        userId,
        'order_status_changed', // Sử dụng event này để frontend tự bắt và điều hướng về /orders/:id
        'Đặt hàng thành công',
        `Cảm ơn bạn! Đơn hàng #${order.id} của bạn đã được ghi nhận và đang chờ xử lý.`,
        { orderId: order.id, newStatus: initialStatus }
      );

      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await notificationService.createAndSend(
          admin.id,
          'new_order',
          'Đơn hàng mới',
          `Có đơn hàng mới #${order.id} vừa được đặt`,
          { orderId: order.id }
        );
      }

      for (const item of cartItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product && product.stock + item.quantity > 10 && product.stock <= 10) {
          for (const admin of admins) {
            await notificationService.createAndSend(
              admin.id,
              'low_stock',
              'Sản phẩm sắp hết hàng',
              `"${product.name}" còn ${product.stock} sản phẩm trong kho`,
              { productId: product.id, productName: product.name, stock: product.stock }
            );
          }
        }
      }
    } catch (err) {
      console.error('[Notification Error] Failed to send new order notifications:', err);
    }
  });

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

  // Payment Intent dùng finalAmount (đã trừ coupon)
  let stripeAmount;
  if (currency === 'vnd') {
    stripeAmount = Math.round(Number(finalAmount));
  } else {
    stripeAmount = Math.round((Number(finalAmount) / VND_TO_USD_RATE) * 100);
  }

  const paymentIntent = await paymentService.createPaymentIntent(
    stripeAmount,
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
    data: { status: 'CANCELLED' },
    include: ORDER_DETAIL_INCLUDE,
  });

  Promise.resolve().then(async () => {
    try {
      await notificationService.createAndSend(
        updatedOrder.userId,
        'order_status_changed',
        'Huỷ đơn thành công',
        `Bạn đã huỷ đơn hàng #${updatedOrder.id} thành công`,
        { orderId: updatedOrder.id, newStatus: 'CANCELLED' }
      );
    } catch (err) {
      console.error('[Notification Error] Failed to send cancel notification:', err);
    }
  });

  // Fire-and-forget: gửi email thông báo hủy đơn đến người mua
  if (updatedOrder.user?.email) {
    emailJob.dispatchOrderCancelledEmail(updatedOrder.user.email, {
      user: { name: updatedOrder.user.name },
      order: {
        id: updatedOrder.id,
        items: updatedOrder.orderItems.map(oi => ({
          name: oi.product?.name || 'Sản phẩm',
          quantity: oi.quantity,
          price: oi.price,
          originalPrice: oi.originalPrice,
        })),
        totalAmount: updatedOrder.totalAmount,
        discountAmount: updatedOrder.discountAmount,
        coupon: updatedOrder.coupon,
      },
      cancelReason: reason || null,
      requiresManualRefund,
    });
  }

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

  // ── Admin cancel: PENDING hoặc PROCESSING → CANCELLED ──────────────────────
  if (newStatus === 'CANCELLED') {
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      throw new AppError(
        `Cannot cancel order in ${order.status} status. Only PENDING or PROCESSING orders can be cancelled.`,
        400,
        ERROR_CODES.ORDER.ORDER_CANNOT_BE_CANCELLED
      );
    }
    const cancelled = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: ORDER_DETAIL_INCLUDE,
    });

    Promise.resolve().then(async () => {
      try {
        await notificationService.createAndSend(
          cancelled.userId,
          'order_status_changed',
          'Đơn hàng bị huỷ',
          `Đơn hàng #${cancelled.id} của bạn đã xác nhận huỷ thành công`,
          { orderId: cancelled.id, newStatus: 'CANCELLED' }
        );
      } catch (err) {
        console.error('[Notification Error] Failed to send cancel notification:', err);
      }
    });

    // Fire-and-forget: gửi email thông báo hủy đến người mua
    if (cancelled.user?.email) {
      emailJob.dispatchOrderCancelledEmail(cancelled.user.email, {
        user: { name: cancelled.user.name },
        order: {
          id: cancelled.id,
          items: cancelled.orderItems.map(oi => ({
            name: oi.product?.name || 'Sản phẩm',
            quantity: oi.quantity,
            price: oi.price,
            originalPrice: oi.originalPrice,
          })),
          totalAmount: cancelled.totalAmount,
          discountAmount: cancelled.discountAmount,
          coupon: cancelled.coupon,
        },
        cancelReason: 'Hủy bởi quản trị viên',
        requiresManualRefund: cancelled.paymentMethod === 'STRIPE' && cancelled.paymentStatus === 'PAID',
      });
    }
    return cancelled;
  }

  // ── Enforce forward flow: PROCESSING → SHIPPED → DELIVERED ─────────────────
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

  const updateData = { status: newStatus };
  if (newStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
    updateData.paymentStatus = 'PAID';
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: ORDER_DETAIL_INCLUDE,
  });

  Promise.resolve().then(async () => {
    try {
      await notificationService.createAndSend(
        updatedOrder.userId,
        'order_status_changed',
        'Cập nhật đơn hàng',
        `Đơn hàng #${updatedOrder.id} của bạn đã chuyển sang trạng thái: ${{
          PENDING: 'Chờ xử lý',
          PROCESSING: 'Đang xử lý',
          SHIPPED: 'Đang giao',
          DELIVERED: 'Đã giao',
          CANCELLED: 'Đã huỷ'
        }[newStatus] || newStatus}`,
        { orderId: updatedOrder.id, newStatus }
      );
    } catch (err) {
      console.error('[Notification Error] Failed to send order status notification:', err);
    }
  });

  if (newStatus === 'PROCESSING') {
    emailJob.dispatchOrderProcessingEmail(updatedOrder.user.email, {
      user: { name: updatedOrder.user.name },
      order: {
        id: updatedOrder.id,
        items: updatedOrder.orderItems.map(oi => ({ name: oi.product.name, quantity: oi.quantity, price: oi.price, originalPrice: oi.originalPrice })),
        totalAmount: updatedOrder.totalAmount,
        discountAmount: updatedOrder.discountAmount,
        coupon: updatedOrder.coupon,
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
        discountAmount: updatedOrder.discountAmount,
        coupon: updatedOrder.coupon,
        shippingAddress: updatedOrder.shippingAddress,
        trackingUrl: updatedOrder.trackingUrl ?? null
      }
    });
  } else if (newStatus === 'DELIVERED') {
    const { getInvoiceByOrderId, issueInvoice } = require('./invoice.service');
    const invoice = await getInvoiceByOrderId(updatedOrder.id);
    let issuedInvoice = null;

    if (invoice && invoice.status === 'DRAFT') {
      try {
        issuedInvoice = await issueInvoice(invoice.id);
      } catch (err) {
        console.error(`[Invoice] Failed to issue/send for order ${updatedOrder.id}:`, err);
      }
    } else if (invoice && invoice.status === 'ISSUED') {
      issuedInvoice = invoice;
    }

    emailJob.dispatchOrderDeliveredEmail(updatedOrder.user.email, {
      user: { name: updatedOrder.user.name },
      order: {
        id: updatedOrder.id,
        items: updatedOrder.orderItems.map(oi => ({ name: oi.product.name, quantity: oi.quantity, price: oi.price, originalPrice: oi.originalPrice })),
        totalAmount: updatedOrder.totalAmount,
        discountAmount: updatedOrder.discountAmount,
        coupon: updatedOrder.coupon,
        shippingAddress: updatedOrder.shippingAddress,
        trackingUrl: updatedOrder.trackingUrl ?? null
      },
      invoice: issuedInvoice,
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

// ─── User: Reviewable items của 1 đơn ────────────────────────────────────────

/**
 * GET /api/orders/:orderId/reviewable-items
 * Trả về danh sách OrderItem của đơn đã giao, kèm hasReviewed.
 * Frontend dùng để render nút "Viết đánh giá" hay "Đã đánh giá".
 */
const getReviewableItems = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: { take: 1, select: { url: true } },
            },
          },
          review: { select: { id: true } },
        },
      },
    },
  });

  if (!order) throw new NotFoundError('Order');

  if (order.userId !== userId) {
    throw new ForbiddenError('Bạn không có quyền xem đơn hàng này.');
  }

  if (order.status !== 'DELIVERED') {
    throw new AppError('Chỉ có thể xem danh sách review của đơn hàng đã giao.', 400);
  }

  const items = order.orderItems.map((item) => ({
    orderItemId: item.id,
    productId: item.productId,
    productName: item.product.name,
    productImage: item.product.images?.[0]?.url ?? null,
    quantity: item.quantity,
    price: item.price,
    hasReviewed: item.review !== null,
  }));

  return { items };
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
  getReviewableItems,
};
