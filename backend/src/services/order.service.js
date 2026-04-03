const prisma = require('../utils/prisma');
const cartService = require('./cart.service');
const paymentService = require('./payment.service');
const emailJob = require('../jobs/emailJob');
const { getFinalPrice, getDiscountPercentFromSnapshot, addPriceFields, getVariantEffectivePricing } = require('../utils/price');
const { AppError, NotFoundError, ConflictError, ForbiddenError } = require('../errors/AppError');
const { validateCoupon } = require('./coupon.service');
const ERROR_CODES = require('../errors/errorCodes');
const { isSaleActive } = require('../utils/saleUtils');
const notificationService = require('./notification.service');
const { buildVariantDisplay } = require('../utils/variantLabel');
const { validateTransition } = require('../utils/orderStateMachine');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VARIANT_ORDER_INCLUDE = {
  include: {
    values: {
      include: {
        attributeValue: {
          include: { attribute: { select: { id: true, name: true, position: true } } },
        },
      },
    },
  },
};

const ORDER_DETAIL_INCLUDE = {
  orderItems: {
    include: {
      product: {
        select: { id: true, name: true, price: true, salePrice: true, images: true, hasVariants: true },
      },
      variant: VARIANT_ORDER_INCLUDE,
      serialUnit: { select: { id: true, serial: true, status: true } },
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
    orderItems: order.orderItems.map((item) => {
      const { options: variantOptions, summary: variantSummary } = item.variant
        ? buildVariantDisplay(item.variant)
        : { options: [], summary: '' };
      return {
        ...item,
        discountPercent: getDiscountPercentFromSnapshot(item.price, item.originalPrice),
        variantOptions,
        variantSummary,
      };
    }),
  };
};

/** Payload dòng sản phẩm cho email (kèm nhãn biến thể). */
function mapOrderItemForEmail(oi) {
  const { summary: variantSummary } = oi.variant ? buildVariantDisplay(oi.variant) : { summary: '' };
  return {
    name: oi.product?.name || 'Sản phẩm',
    quantity: oi.quantity,
    price: oi.price,
    originalPrice: oi.originalPrice,
    variantSummary,
  };
}

/**
 * Trừ kho + suất giảm giá (flash sale) khi xác nhận đơn — gọi khi PENDING→CONFIRMED hoặc webhook thanh toán.
 */
async function deductInventoryForOrderTx(tx, orderItems, productNameFallback) {
  for (const item of orderItems) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new NotFoundError('Product');

    if (product.hasVariants) {
      if (!item.variantId) {
        throw new AppError('Vui lòng chọn biến thể', 400, ERROR_CODES.PRODUCT.VARIANT_REQUIRED);
      }
      const variant = await tx.productVariant.findFirst({
        where: { id: item.variantId, productId: product.id, deletedAt: null },
      });
      if (!variant) throw new NotFoundError('Variant');
      if (variant.stock < item.quantity) {
        throw new ConflictError(
          `Product "${productNameFallback || product.name}" does not have enough stock (remaining ${variant.stock})`,
          ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK
        );
      }
      const vp = getVariantEffectivePricing(product, variant);

      if (vp.saleSource === 'variant' && variant.saleStock != null) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: variant.id,
            saleSoldCount: { lt: variant.saleStock },
          },
          data: { saleSoldCount: { increment: item.quantity } },
        });
        if (updated.count === 0) {
          throw new ConflictError(
            'Biến thể đã hết suất giảm giá. Vui lòng đặt lại với giá gốc.',
            'SALE_SOLD_OUT'
          );
        }
      } else if (vp.saleSource === 'product' && product.saleStock != null) {
        const updated = await tx.product.updateMany({
          where: {
            id: product.id,
            saleSoldCount: { lt: product.saleStock },
          },
          data: { saleSoldCount: { increment: item.quantity } },
        });
        if (updated.count === 0) {
          throw new ConflictError(
            'Sản phẩm đã hết suất giảm giá. Vui lòng đặt lại với giá gốc.',
            'SALE_SOLD_OUT'
          );
        }
      }

      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: { decrement: item.quantity } },
      });
      continue;
    }

    if (item.variantId) {
      throw new AppError('Giỏ hàng không hợp lệ', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
    }

    const saleActive = isSaleActive(product);
    if (product.stock < item.quantity) {
      throw new ConflictError(
        `Product "${product.name}" does not have enough stock (remaining ${product.stock})`,
        ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK
      );
    }

    if (saleActive && product.saleStock != null) {
      const updated = await tx.product.updateMany({
        where: {
          id: product.id,
          saleSoldCount: { lt: product.saleStock },
        },
        data: { saleSoldCount: { increment: item.quantity } },
      });

      if (updated.count === 0) {
        throw new ConflictError(
          'Sản phẩm đã hết suất giảm giá. Vui lòng đặt lại với giá gốc.',
          'SALE_SOLD_OUT'
        );
      }
    }

    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }
}

/** Hoàn kho khi huỷ đơn đã trừ kho (CONFIRMED trở đi, trừ PENDING). */
async function restoreInventoryForOrderTx(tx, orderItems) {
  for (const oi of orderItems) {
    if (oi.variantId) {
      await tx.productVariant.update({
        where: { id: oi.variantId },
        data: { stock: { increment: oi.quantity } },
      });
    } else {
      await tx.product.update({
        where: { id: oi.productId },
        data: { stock: { increment: oi.quantity } },
      });
    }
  }
}

async function releaseReservedSerialsTx(tx, orderItems) {
  for (const oi of orderItems) {
    if (!oi.serialUnitId) continue;
    await tx.serialUnit.update({
      where: { id: oi.serialUnitId },
      data: { status: 'IN_STOCK', reservedAt: null },
    });
    await tx.orderItem.update({
      where: { id: oi.id },
      data: { serialUnitId: null, assignedAt: null },
    });
  }
}

const STATUS_LABEL_VI = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
  RETURNED: 'Đã hoàn trả',
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

  // $transaction: tạo Order — KHÔNG trừ kho tại đây; trừ kho khi CONFIRMED (admin hoặc thanh toán online).
  const order = await prisma.$transaction(async (tx) => {
    const orderItemsData = [];

    for (const item of cartItems) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundError('Product');

      if (product.hasVariants) {
        if (!item.variantId) {
          throw new AppError('Vui lòng chọn biến thể', 400, ERROR_CODES.PRODUCT.VARIANT_REQUIRED);
        }
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId, productId: product.id, deletedAt: null },
        });
        if (!variant) throw new NotFoundError('Variant');
        if (variant.stock < item.quantity) {
          throw new ConflictError(
            `Product "${item.name}" does not have enough stock (remaining ${variant.stock})`,
            ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK
          );
        }
        const vp = getVariantEffectivePricing(product, variant);
        const effectivePrice = vp.finalPrice;

        orderItemsData.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: effectivePrice,
          originalPrice: parseFloat(variant.price),
        });
        continue;
      }

      if (item.variantId) {
        throw new AppError('Giỏ hàng không hợp lệ', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
      }

      const saleActive = isSaleActive(product);
      const effectivePrice = saleActive ? product.salePrice : product.price;

      if (product.stock < item.quantity) {
        throw new ConflictError(
          `Product "${item.name}" does not have enough stock (remaining ${product.stock})`,
          ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK
        );
      }

      orderItemsData.push({
        productId: item.productId,
        variantId: null,
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
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      
      // Chỉ gửi thông báo lập tức nếu thanh toán bằng COD
      // Với STRIPE và SEPAY, việc gửi thông báo sẽ được trigger bởi Webhook sau khi thanh toán thành công
      if (paymentMethod === 'COD') {
        // Thông báo cho User vừa đặt hàng
        await notificationService.createAndSend(
          userId,
          'order_status_changed', // Sử dụng event này để frontend tự bắt và điều hướng về /orders/:id
          'Đặt hàng thành công',
          `Cảm ơn bạn! Đơn hàng #${order.id} của bạn đã được ghi nhận và đang chờ xử lý.`,
          { orderId: order.id, newStatus: initialStatus }
        );

        for (const admin of admins) {
          await notificationService.createAndSend(
            admin.id,
            'new_order',
            'Đơn hàng mới',
            `Có đơn hàng mới #${order.id} vừa được đặt`,
            { orderId: order.id }
          );
        }
      }

      // Low-stock: dùng job lowStockJob (cron) + inventory service
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

  // SEPAY (VietQR): Trả về checkoutUrl
  if (paymentMethod === 'SEPAY') {
    const { checkoutUrl, fields } = await paymentService.createSepayCheckout(orderWithDiscounts);
    return {
      order: orderWithDiscounts,
      checkoutUrl,
      sepayFields: fields,
    };
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
            variant: VARIANT_ORDER_INCLUDE,
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

  const orderWithDiscounts = _addOrderItemDiscounts(order);

  // Thêm SePay checkout object cho đơn hàng user chưa thanh toán
  // Chỉ gen link thanh toán rkhhi người dùng đang xem chính là chủ đơn hàng (đề phòng admin tự ý thanh toán thay)
  if (order.paymentMethod === 'SEPAY' && order.paymentStatus === 'UNPAID' && order.status === 'PENDING' && order.userId === userId) {
    const { checkoutUrl, fields } = await paymentService.createSepayCheckout(orderWithDiscounts);
    orderWithDiscounts.sepayCheckout = { checkoutUrl, sepayFields: fields };
  }

  return orderWithDiscounts;
};

// ─── User: Huỷ đơn ───────────────────────────────────────────────────────────

const cancelOrder = async (orderId, userId, reason) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });

  if (!order) throw new NotFoundError('Order');
  if (order.userId !== userId) throw new ForbiddenError('You do not have permission to cancel this order');

  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new AppError(
      `Cannot cancel order in ${order.status} status. Only PENDING or CONFIRMED orders can be cancelled.`,
      400,
      ERROR_CODES.ORDER.ORDER_CANNOT_BE_CANCELLED
    );
  }

  const requiresManualRefund =
    order.paymentMethod === 'STRIPE' && order.paymentStatus === 'PAID';

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (order.status === 'CONFIRMED') {
      await restoreInventoryForOrderTx(tx, order.orderItems);
    }
    return tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: ORDER_DETAIL_INCLUDE,
    });
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
            variant: { select: { id: true, sku: true, price: true } },
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

const adminUpdateOrderStatus = async (orderId, newStatus, payload = {}) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });

  if (!order) throw new NotFoundError('Order');

  if (order.status === 'CANCELLED' || order.status === 'RETURNED') {
    throw new AppError('Cannot update this order', 400, ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION);
  }

  if (newStatus === 'CANCELLED') {
    validateTransition(order.status, 'CANCELLED');

    const cancelled = await prisma.$transaction(async (tx) => {
      if (['CONFIRMED', 'PACKING', 'SHIPPING'].includes(order.status)) {
        await restoreInventoryForOrderTx(tx, order.orderItems);
      }
      if (['PACKING', 'SHIPPING'].includes(order.status)) {
        await releaseReservedSerialsTx(tx, order.orderItems);
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: ORDER_DETAIL_INCLUDE,
      });
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

    if (cancelled.user?.email) {
      emailJob.dispatchOrderCancelledEmail(cancelled.user.email, {
        user: { name: cancelled.user.name },
        order: {
          id: cancelled.id,
          items: cancelled.orderItems.map(mapOrderItemForEmail),
          totalAmount: cancelled.totalAmount,
          discountAmount: cancelled.discountAmount,
          coupon: cancelled.coupon,
        },
        cancelReason: payload.reason || 'Hủy bởi quản trị viên',
        requiresManualRefund: cancelled.paymentMethod === 'STRIPE' && cancelled.paymentStatus === 'PAID',
      });
    }
    return cancelled;
  }

  validateTransition(order.status, newStatus);

  if (newStatus === 'CONFIRMED' && order.status === 'PENDING') {
    if (order.paymentMethod !== 'COD' && order.paymentStatus === 'UNPAID') {
      throw new AppError(
        'Đơn thanh toán online chưa hoàn tất — không thể xác nhận thủ công',
        400,
        ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION
      );
    }
    const updatedOrder = await prisma.$transaction(async (tx) => {
      await deductInventoryForOrderTx(tx, order.orderItems);
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
        include: ORDER_DETAIL_INCLUDE,
      });
    });

    Promise.resolve().then(async () => {
      try {
        await notificationService.createAndSend(
          updatedOrder.userId,
          'order_status_changed',
          'Đơn hàng đã xác nhận',
          `Đơn hàng #${updatedOrder.id} đã được xác nhận.`,
          { orderId: updatedOrder.id, newStatus: 'CONFIRMED' }
        );
      } catch (err) {
        console.error('[Notification Error] Failed to send order status notification:', err);
      }
    });

    emailJob.dispatchOrderProcessingEmail(updatedOrder.user.email, {
      user: { name: updatedOrder.user.name },
      order: {
        id: updatedOrder.id,
        items: updatedOrder.orderItems.map(mapOrderItemForEmail),
        totalAmount: updatedOrder.totalAmount,
        discountAmount: updatedOrder.discountAmount,
        coupon: updatedOrder.coupon,
        shippingAddress: updatedOrder.shippingAddress,
      },
    });
    return updatedOrder;
  }

  if (newStatus === 'SHIPPING' && order.status === 'PACKING') {
    const { trackingCode, trackingUrl, carrierName } = payload;
    if (!carrierName || !String(carrierName).trim() || !trackingCode || !String(trackingCode).trim()) {
      throw new AppError('Vui lòng nhập đơn vị vận chuyển và mã vận đơn', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
    }
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPING',
        carrierName: String(carrierName).trim(),
        trackingCode: String(trackingCode).trim(),
        trackingUrl: trackingUrl ? String(trackingUrl).trim() : null,
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    Promise.resolve().then(async () => {
      try {
        await notificationService.createAndSend(
          updatedOrder.userId,
          'order_status_changed',
          'Đơn hàng đang giao',
          `Đơn hàng #${updatedOrder.id} đã giao cho đơn vị vận chuyển.`,
          { orderId: updatedOrder.id, newStatus: 'SHIPPING' }
        );
      } catch (err) {
        console.error('[Notification Error] Failed to send order status notification:', err);
      }
    });

    emailJob.dispatchOrderShippedEmail(updatedOrder.user.email, {
      user: { name: updatedOrder.user.name },
      order: {
        id: updatedOrder.id,
        items: updatedOrder.orderItems.map(mapOrderItemForEmail),
        totalAmount: updatedOrder.totalAmount,
        discountAmount: updatedOrder.discountAmount,
        coupon: updatedOrder.coupon,
        shippingAddress: updatedOrder.shippingAddress,
        trackingUrl: updatedOrder.trackingUrl ?? null,
      },
    });
    return updatedOrder;
  }

  if (newStatus === 'COMPLETED' && order.status === 'SHIPPING') {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({
        where: { orderId },
        include: { serialUnit: true },
      });
      for (const oi of items) {
        if (oi.serialUnitId) {
          await tx.serialUnit.update({
            where: { id: oi.serialUnitId },
            data: { status: 'SOLD', soldAt: new Date() },
          });
        }
      }
      const data = {
        status: 'COMPLETED',
        ...(order.paymentMethod === 'COD' ? { paymentStatus: 'PAID' } : {}),
      };
      return tx.order.update({
        where: { id: orderId },
        data,
        include: ORDER_DETAIL_INCLUDE,
      });
    });

    Promise.resolve().then(async () => {
      try {
        await notificationService.createAndSend(
          updatedOrder.userId,
          'order_status_changed',
          'Đơn hàng hoàn thành',
          `Đơn hàng #${updatedOrder.id} đã giao thành công.`,
          { orderId: updatedOrder.id, newStatus: 'COMPLETED' }
        );
      } catch (err) {
        console.error('[Notification Error] Failed to send order status notification:', err);
      }
    });

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
        items: updatedOrder.orderItems.map(mapOrderItemForEmail),
        totalAmount: updatedOrder.totalAmount,
        discountAmount: updatedOrder.discountAmount,
        coupon: updatedOrder.coupon,
        shippingAddress: updatedOrder.shippingAddress,
        trackingUrl: updatedOrder.trackingUrl ?? null,
      },
      invoice: issuedInvoice,
    });
    return updatedOrder;
  }

  if (newStatus === 'RETURNED' && order.status === 'COMPLETED') {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const oi of items) {
        if (oi.serialUnitId) {
          await tx.serialUnit.update({
            where: { id: oi.serialUnitId },
            data: { status: 'RETURNED', returnedAt: new Date() },
          });
        }
      }
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'RETURNED' },
        include: ORDER_DETAIL_INCLUDE,
      });
    });

    Promise.resolve().then(async () => {
      try {
        await notificationService.createAndSend(
          updatedOrder.userId,
          'order_status_changed',
          'Hoàn trả đơn hàng',
          `Đơn hàng #${updatedOrder.id} đã được ghi nhận hoàn trả.`,
          { orderId: updatedOrder.id, newStatus: 'RETURNED' }
        );
      } catch (err) {
        console.error('[Notification Error] Failed to send order status notification:', err);
      }
    });
    return updatedOrder;
  }

  throw new AppError(
    `Chuyển trạng thái không hợp lệ từ ${order.status} sang ${newStatus}`,
    400,
    ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION
  );
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

  if (order.status !== 'COMPLETED') {
    throw new AppError('Chỉ có thể xem danh sách review của đơn hàng đã hoàn thành.', 400);
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

const getAvailableSerialsForOrder = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: { select: { id: true, name: true, hasVariants: true } },
          variant: { select: { id: true, sku: true } },
        },
      },
    },
  });
  if (!order) throw new NotFoundError('Order');

  const byItem = await Promise.all(
    order.orderItems.map(async (oi) => {
      const available = await prisma.serialUnit.findMany({
        where: {
          status: 'IN_STOCK',
          productId: oi.productId,
          variantId: oi.variantId || null,
        },
        select: { id: true, serial: true, status: true },
        orderBy: { serial: 'asc' },
        take: 200,
      });
      return {
        orderItemId: oi.id,
        productId: oi.productId,
        productName: oi.product?.name ?? '—',
        variantId: oi.variantId,
        variantSku: oi.variant?.sku ?? null,
        quantity: oi.quantity,
        availableSerials: available,
      };
    })
  );

  return { orderId: order.id, items: byItem };
};

const assignSerialsToOrder = async (orderId, assignments) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });
  if (!order) throw new NotFoundError('Order');
  if (order.status !== 'CONFIRMED') {
    throw new AppError('Chỉ gán serial khi đơn ở trạng thái CONFIRMED', 400, ERROR_CODES.ORDER.INVALID_ORDER_STATUS_TRANSITION);
  }

  const byItemId = new Map(order.orderItems.map((oi) => [oi.id, oi]));
  for (const oi of order.orderItems) {
    if (oi.quantity !== 1) {
      throw new AppError(
        'Gán serial/IMEI hiện chỉ hỗ trợ từng dòng số lượng 1',
        400,
        ERROR_CODES.SERVER.VALIDATION_ERROR
      );
    }
  }
  if (assignments.length !== order.orderItems.length) {
    throw new AppError('Phải gán đủ serial cho tất cả dòng sản phẩm', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }
  const seen = new Set();
  for (const a of assignments) {
    if (!byItemId.has(a.orderItemId)) {
      throw new AppError('orderItemId không thuộc đơn hàng', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
    }
    if (seen.has(a.orderItemId)) {
      throw new AppError('Trùng orderItemId trong danh sách gán', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
    }
    seen.add(a.orderItemId);
  }

  return prisma.$transaction(async (tx) => {
    for (const { orderItemId, serialUnitId } of assignments) {
      const oi = byItemId.get(orderItemId);
      const locked = await tx.serialUnit.updateMany({
        where: {
          id: serialUnitId,
          status: 'IN_STOCK',
          productId: oi.productId,
          variantId: oi.variantId || null,
        },
        data: { status: 'RESERVED', reservedAt: new Date() },
      });
      if (locked.count === 0) {
        throw new ConflictError('Serial không khả dụng hoặc không khớp sản phẩm', 'SERIAL_UNAVAILABLE');
      }
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: { serialUnitId, assignedAt: new Date() },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: 'PACKING' },
      include: ORDER_DETAIL_INCLUDE,
    });
  });
};

const userRequestReturn = async (orderId, userId, reason) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });
  if (!order) throw new NotFoundError('Order');
  if (order.userId !== userId) throw new ForbiddenError('Bạn không có quyền thao tác đơn này');
  if (order.status !== 'COMPLETED') {
    throw new AppError('Chỉ có thể hoàn trả đơn đã hoàn thành.', 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const oi of items) {
      if (oi.serialUnitId) {
        await tx.serialUnit.update({
          where: { id: oi.serialUnitId },
          data: { status: 'RETURNED', returnedAt: new Date() },
        });
      }
    }
    return tx.order.update({
      where: { id: orderId },
      data: { status: 'RETURNED' },
      include: ORDER_DETAIL_INCLUDE,
    });
  });

  Promise.resolve().then(async () => {
    try {
      await notificationService.createAndSend(
        updated.userId,
        'order_status_changed',
        'Yêu cầu hoàn trả',
        `Đơn hàng #${updated.id} đã chuyển sang hoàn trả.${reason ? ` Lý do: ${reason}` : ''}`,
        { orderId: updated.id, newStatus: 'RETURNED' }
      );
    } catch (err) {
      console.error('[Notification Error] return notification:', err);
    }
  });

  return { order: updated };
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
  deductInventoryForOrderTx,
  getAvailableSerialsForOrder,
  assignSerialsToOrder,
  userRequestReturn,
};
