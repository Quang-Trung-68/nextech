const prisma = require("../utils/prisma");
const stripe = require("../utils/stripe");
const emailJob = require("../jobs/emailJob");
const notificationService = require("./notification.service");
const {
  AppError,
  NotFoundError,
  ForbiddenError,
} = require("../errors/AppError");
const ERROR_CODES = require("../errors/errorCodes");
const { SePayPgClient } = require("sepay-pg-node");

const handleWebhookEvent = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    throw new AppError(
      `Invalid webhook signature: ${err.message}`,
      400,
      ERROR_CODES.PAYMENT.STRIPE_WEBHOOK_INVALID,
    );
  }

  console.log(event.type);

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;

      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!order) {
        console.warn(
          `[Webhook] Order not found for PaymentIntent ${paymentIntent.id}`,
        );
        break;
      }

      if (order.paymentStatus === "PAID") {
        break;
      }

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "PROCESSING",
          },
          include: {
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
          },
        });

        await tx.cartItem.deleteMany({
          where: { cart: { userId: order.userId } },
        });

        return o;
      });

      console.log(`[Webhook] Payment succeeded for order ${order.id}`);

      // Fire-and-forget: không block Stripe webhook response
      emailJob.dispatchOrderConfirmationEmail(updatedOrder.user.email, {
        name: updatedOrder.user.name,
        order: updatedOrder,
      });

      // Thông báo cho User & Admin
      Promise.resolve().then(async () => {
        try {
          // Thông báo cho User vừa thanh toán thành công
          await notificationService.createAndSend(
            updatedOrder.userId,
            "order_status_changed",
            "Thanh toán thành công",
            `Cảm ơn bạn! Đơn hàng #${updatedOrder.id} đã thanh toán qua thẻ thành công.`,
            { orderId: updatedOrder.id, newStatus: "PROCESSING" },
          );

          const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
          });
          for (const admin of admins) {
            await notificationService.createAndSend(
              admin.id,
              "new_order",
              "Đơn hàng đã thanh toán",
              `Đơn hàng #${updatedOrder.id} vừa được thanh toán thành công qua thẻ`,
              { orderId: updatedOrder.id },
            );
          }
        } catch (err) {
          console.error(
            "[Notification Error] Failed to send payment success notification:",
            err,
          );
        }
      });

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!order) {
        console.warn(
          `[Webhook] Order not found for PaymentIntent ${paymentIntent.id}`,
        );
        break;
      }

      // Không update DB (giữ nguyên đơn hàng chờ thanh toán)
      // await prisma.order.update({
      //   where: { id: order.id },
      //   data: {
      //     paymentStatus: 'UNPAID',
      //     status: 'PENDING',
      //   },
      // });

      console.log(
        `[Webhook] Payment failed for order ${order.id}. Reason: ${paymentIntent.last_payment_error?.message}`,
      );
      break;
    }

    default:
      console.log(`[Webhook] Unhandled webhook event: ${event.type}`);
  }

  return { received: true, type: event.type };
};

const getPaymentIntent = async (paymentIntentId) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
};

const createPaymentIntent = async (amount, currency, metadata) => {
  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
  });
};

// ─── SEPAY (VietQR) ──────────────────────────────────────────────────────────

const getSepayClient = () => {
  return new SePayPgClient({
    env: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    merchant_id: process.env.SEPAY_MERCHANT_ID || "sandbox_merchant",
    secret_key: process.env.SEPAY_SECRET_KEY || "sandbox_secret",
  });
};

const createSepayCheckout = async (order) => {
  const client = getSepayClient();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  // order_invoice_number length should be within SePay limit, e.g. "INV-123456"
  // Here we use the order.id which might be cuid (25 chars). It's generally fine, or we prepend INV-
  const invoiceNumber = `INV-${order.id}`;

  const fields = client.checkout.initOneTimePaymentFields({
    operation: "PURCHASE",
    payment_method: "BANK_TRANSFER",
    order_invoice_number: invoiceNumber,
    order_amount: Math.round(Number(order.totalAmount)),
    currency: "VND", // Ensure it's VND
    order_description: `Thanh toan don hang ${order.id}`,
    success_url: `${frontendUrl}/profile/orders/${order.id}?success=true`,
    error_url: `${frontendUrl}/profile/orders/${order.id}?error=true`,
    cancel_url: `${frontendUrl}/profile/orders/${order.id}?cancel=true`,
  });

  return {
    checkoutUrl: client.checkout.initCheckoutUrl(),
    fields,
  };
};

const SEPAY_ORDER_INCLUDE = {
  orderItems: {
    include: {
      product: {
        select: { id: true, name: true, price: true, images: true },
      },
    },
  },
  user: { select: { id: true, name: true, email: true } },
};

/** Theo tài liệu SePay PG: CAPTURED = đã thanh toán xong. */
function isSepayOrderPaidFromApi(body) {
  const payload = body?.data ?? body;
  if (!payload || typeof payload !== "object") return false;
  const status =
    payload.order_status ?? payload.order?.order_status ?? body?.order_status;
  if (!status) return false;
  const u = String(status).toUpperCase();
  return (
    u === "CAPTURED" ||
    u === "PAID" ||
    u === "COMPLETED" ||
    u === "SUCCESS" ||
    u === "ORDER_PAID"
  );
}

/**
 * Ghi nhận thanh toán SePay vào DB + email + Soketi. Idempotent nếu đã PAID.
 * Dùng chung cho IPN webhook và POST sync sau redirect success_url.
 */
async function finalizeSepayOrderPaid(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: SEPAY_ORDER_INCLUDE,
  });

  if (!order) {
    console.warn(`[SePay] finalizeSepayOrderPaid: order not found ${orderId}`);
    return null;
  }

  if (order.paymentStatus === "PAID") {
    return { skipped: true, orderId: order.id };
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "PROCESSING",
      },
      include: SEPAY_ORDER_INCLUDE,
    });

    await tx.cartItem.deleteMany({
      where: { cart: { userId: order.userId } },
    });

    return o;
  });

  console.log(`[SePay] Payment recorded for order ${order.id}`);
  emailJob.dispatchOrderConfirmationEmail(updatedOrder.user.email, {
    name: updatedOrder.user.name,
    order: updatedOrder,
  });

  Promise.resolve().then(async () => {
    try {
      await notificationService.createAndSend(
        updatedOrder.userId,
        "order_status_changed",
        "Thanh toán thành công",
        `Cảm ơn bạn! Đơn hàng #${updatedOrder.id} đã thanh toán VietQR thành công.`,
        { orderId: updatedOrder.id, newStatus: "PROCESSING" },
      );

      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      for (const admin of admins) {
        await notificationService.createAndSend(
          admin.id,
          "new_order",
          "Đơn hàng đã thanh toán",
          `Đơn hàng #${updatedOrder.id} vừa được thanh toán thành công qua VietQR`,
          { orderId: updatedOrder.id },
        );
      }
    } catch (err) {
      console.error(
        "[Notification Error] Failed to send sepay payment success notification:",
        err,
      );
    }
  });

  return { skipped: false, orderId: order.id, order: updatedOrder };
}

const handleSepayWebhookEvent = async (data) => {
  console.log(
    "[SePay Webhook] Received:",
    data.notification_type,
    data.order?.order_invoice_number,
  );

  if (data.notification_type !== "ORDER_PAID") {
    return;
  }

  const invoiceNumber = data.order?.order_invoice_number;
  if (!invoiceNumber) {
    console.warn("[SePay Webhook] Missing order_invoice_number");
    return;
  }

  const orderId = invoiceNumber.startsWith("INV-")
    ? invoiceNumber.slice(4)
    : invoiceNumber.replace(/^INV-/, "");

  await finalizeSepayOrderPaid(orderId);
};

/**
 * Sau khi user về từ success_url — đồng bộ trạng thái từ SePay API (tra cứu đơn).
 * Bổ sung khi IPN webhook chưa kịp hoặc không tới được server (dev/ngrok).
 */
const syncSepayOrderAfterRedirect = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      paymentMethod: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    throw new NotFoundError("Order");
  }
  if (order.userId !== userId) {
    throw new ForbiddenError("Not authorized to access this order");
  }
  if (order.paymentMethod !== "SEPAY") {
    throw new AppError(
      "Order does not use SEPAY payment method",
      400,
      ERROR_CODES.PAYMENT.PAYMENT_FAILED,
    );
  }
  if (order.paymentStatus === "PAID") {
    return { alreadyPaid: true, orderId: order.id };
  }

  const client = getSepayClient();
  const invoiceNumber = `INV-${orderId}`;

  let res;
  try {
    res = await client.order.retrieve(invoiceNumber);
  } catch (e) {
    const httpStatus = e.response?.status;
    if (httpStatus === 404) {
      return {
        synced: false,
        paidOnSePay: false,
        pending: true,
        message: "Đơn hàng chưa xuất hiện trên SePay hoặc đang đồng bộ.",
      };
    }
    throw e;
  }

  const body = res.data;
  if (!isSepayOrderPaidFromApi(body)) {
    const st =
      body?.data?.order_status ?? body?.order_status ?? "UNKNOWN";
    return {
      synced: false,
      paidOnSePay: false,
      sepayStatus: st,
      message: "SePay chưa ghi nhận thanh toán hoàn tất.",
    };
  }

  const result = await finalizeSepayOrderPaid(orderId);
  return { synced: true, ...result };
};

/**
 * Frontend gọi để lấy clientSecret của order (dùng mộunt Stripe Elements).
 * Chỉ trả nếu order thược sở user và chưa được thanh toán.
 */
const getOrderPaymentIntent = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      paymentMethod: true,
      paymentStatus: true,
      stripePaymentIntentId: true,
      stripeClientSecret: true,
      totalAmount: true,
    },
  });

  if (!order) {
    throw new NotFoundError("Order");
  }

  if (order.userId !== userId) {
    throw new ForbiddenError("Not authorized to access this order");
  }

  if (order.paymentMethod !== "STRIPE") {
    throw new AppError(
      "Order does not use STRIPE payment method",
      400,
      ERROR_CODES.PAYMENT.PAYMENT_FAILED,
    );
  }

  if (order.paymentStatus === "PAID") {
    throw new AppError(
      "This order has already been paid",
      400,
      ERROR_CODES.PAYMENT.PAYMENT_FAILED,
    );
  }

  if (!order.stripeClientSecret) {
    throw new AppError(
      "Payment Intent has not been created for this order",
      400,
      ERROR_CODES.PAYMENT.PAYMENT_INTENT_FAILED,
    );
  }

  return {
    orderId: order.id,
    clientSecret: order.stripeClientSecret,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
  };
};

/**
 * Frontend polling sau khi stripe.confirmCardPayment() trả về để biết DB đã update chưa.
 * Trả về status hiện tại của order trong DB.
 */
const getOrderPaymentStatus = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      stripePaymentIntentId: true,
    },
  });

  if (!order) {
    throw new NotFoundError("Order");
  }

  if (order.userId !== userId) {
    throw new ForbiddenError("Not authorized to access this order");
  }

  return {
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    isPaid: order.paymentStatus === "PAID",
  };
};

module.exports = {
  handleWebhookEvent,
  getPaymentIntent,
  createPaymentIntent,
  getOrderPaymentIntent,
  getOrderPaymentStatus,
  createSepayCheckout,
  handleSepayWebhookEvent,
  syncSepayOrderAfterRedirect,
};
