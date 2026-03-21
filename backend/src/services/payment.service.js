const prisma = require('../utils/prisma');
const stripe = require('../utils/stripe');
const emailJob = require('../jobs/emailJob');
const { AppError, NotFoundError, ForbiddenError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

const handleWebhookEvent = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw new AppError(`Invalid webhook signature: ${err.message}`, 400, ERROR_CODES.PAYMENT.STRIPE_WEBHOOK_INVALID);
  }

  console.log(event.type);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      
      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!order) {
        console.warn(`[Webhook] Order not found for PaymentIntent ${paymentIntent.id}`);
        break;
      }

      if (order.paymentStatus === 'PAID') {
        break;
      }

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
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
      emailJob.dispatchOrderConfirmationEmail(updatedOrder.user.email, { name: updatedOrder.user.name, order: updatedOrder });
      
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      
      const order = await prisma.order.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (!order) {
        console.warn(`[Webhook] Order not found for PaymentIntent ${paymentIntent.id}`);
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

      console.log(`[Webhook] Payment failed for order ${order.id}. Reason: ${paymentIntent.last_payment_error?.message}`);
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
    throw new NotFoundError('Order');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this order');
  }

  if (order.paymentMethod !== 'STRIPE') {
    throw new AppError('Order does not use STRIPE payment method', 400, ERROR_CODES.PAYMENT.PAYMENT_FAILED);
  }

  if (order.paymentStatus === 'PAID') {
    throw new AppError('This order has already been paid', 400, ERROR_CODES.PAYMENT.PAYMENT_FAILED);
  }

  if (!order.stripeClientSecret) {
    throw new AppError('Payment Intent has not been created for this order', 400, ERROR_CODES.PAYMENT.PAYMENT_INTENT_FAILED);
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
    throw new NotFoundError('Order');
  }

  if (order.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this order');
  }

  return {
    orderId: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    isPaid: order.paymentStatus === 'PAID',
  };
};

module.exports = {
  handleWebhookEvent,
  getPaymentIntent,
  createPaymentIntent,
  getOrderPaymentIntent,
  getOrderPaymentStatus,
};
