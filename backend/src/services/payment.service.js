const prisma = require('../utils/prisma');
const stripe = require('../utils/stripe');

const handleWebhookEvent = async (rawBody, signature) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const error = new Error(`Webhook signature không hợp lệ: ${err.message}`);
    error.statusCode = 400;
    throw error;
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

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
          },
        });

        await tx.cartItem.deleteMany({
          where: { cart: { userId: order.userId } },
        });
      });

      console.log(`[Webhook] Payment succeeded for order ${order.id}`);
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

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'UNPAID',
          status: 'PENDING',
        },
      });

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
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.userId !== userId) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }

  if (order.paymentMethod !== 'STRIPE') {
    const error = new Error('Order không sử dụng phương thức STRIPE');
    error.statusCode = 400;
    throw error;
  }

  if (order.paymentStatus === 'PAID') {
    const error = new Error('Đơn hàng này đã được thanh toán');
    error.statusCode = 400;
    throw error;
  }

  if (!order.stripeClientSecret) {
    const error = new Error('Payment Intent chưa được tạo cho đơn hàng này');
    error.statusCode = 400;
    throw error;
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
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.userId !== userId) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
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
