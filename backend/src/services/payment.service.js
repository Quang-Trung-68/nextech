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

module.exports = {
  handleWebhookEvent,
  getPaymentIntent,
  createPaymentIntent,
};
