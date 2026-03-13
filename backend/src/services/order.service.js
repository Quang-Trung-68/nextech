const prisma = require('../utils/prisma');
const cartService = require('./cart.service');
const paymentService = require('./payment.service');

const createOrder = async (userId, shippingAddress, paymentMethod) => {
  const userCart = await cartService.getCart(userId);
  const cartItems = userCart.items;

  if (cartItems.length === 0) {
    const error = new Error('Cart is empty');
    error.statusCode = 400;
    throw error;
  }

  let totalAmount = 0;

  // Validate stock for all items before starting transaction
  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      const error = new Error(`Not enough stock for ${item.name}`);
      error.statusCode = 400;
      throw error;
    }
    totalAmount += Number(item.price) * item.quantity;
  }

  // Create transactions array
  const createOrderOp = prisma.order.create({
      data: {
        userId,
        shippingAddress,
        paymentMethod,
        totalAmount,
        orderItems: {
            create: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            }))
        }
      },
      include: {
          orderItems: {
              include: {
                  product: {
                      select: { name: true }
                  }
              }
          }
      }
  });

  const updateStockOps = cartItems.map(item => 
      prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
      })
  );

  const clearCartOp = prisma.cartItem.deleteMany({
      where: { cart: { userId } }
  });

  const [order] = await prisma.$transaction([createOrderOp, ...updateStockOps, clearCartOp]);

  if (paymentMethod === 'STRIPE') {
    let finalAmount = Math.round(Number(totalAmount));
    if ((process.env.STRIPE_CURRENCY || 'vnd').toLowerCase() !== 'vnd') {
        finalAmount = Math.round(Number(totalAmount) * 100);
    }
    
    const paymentIntent = await paymentService.createPaymentIntent(
      finalAmount,
      process.env.STRIPE_CURRENCY || 'vnd',
      {
        orderId: order.id,
        userId: userId
      }
    );

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret
      },
      include: {
          orderItems: {
              include: {
                  product: {
                      select: { name: true }
                  }
              }
          }
      }
    });

    return {
      order: { ...updatedOrder, clientSecret: paymentIntent.client_secret },
      clientSecret: paymentIntent.client_secret
    };
  }

  return { order };
};

const getMyOrders = async (userId) => {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: {
        include: {
          product: {
            select: { name: true, price: true },
          },
        },
      },
    },
  });
};

const getOrderById = async (orderId, userId, role) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: { select: { name: true, price: true, images: true } }
        }
      },
      user: {
          select: { name: true, email: true }
      }
    },
  });

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.userId !== userId && role !== 'ADMIN') {
    const error = new Error('Not authorized to access this order');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

const updateOrderStatus = async (orderId, status) => {
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
        const error = new Error('Invalid order status');
        error.statusCode = 400;
        throw error;
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status }
    });
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
