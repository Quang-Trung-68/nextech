const prisma = require('../utils/prisma');
const { getFinalPrice, getDiscountPercent, addPriceFields } = require('../utils/price');

const _getOrCreateCart = async (userId) => {
  return await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        include: {
          product: { include: { images: true } }
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
};

const _formatCart = (cart) => {
  let totalItems = 0;
  let cartTotal = 0;

  const items = cart.items.map((item) => {
    const finalPrice = getFinalPrice(item.product.price, item.product.salePrice);
    const discountPercent = getDiscountPercent(item.product.price, item.product.salePrice);
    const lineTotal = finalPrice * item.quantity;
    totalItems += item.quantity;
    cartTotal += lineTotal;

    return {
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      salePrice: item.product.salePrice,
      finalPrice,
      discountPercent,
      image: item.product.images && item.product.images.length > 0 ? item.product.images[0].url : null,
      stock: item.product.stock,
      quantity: item.quantity,
      lineTotal,
      // Keep legacy subtotal field for backward compat
      subtotal: lineTotal,
    };
  });

  return {
    id: cart.id,
    items,
    totalItems,
    totalAmount: cartTotal,
    cartTotal,
    updatedAt: cart.updatedAt,
  };
};

const getCart = async (userId) => {
  const cart = await _getOrCreateCart(userId);
  return _formatCart(cart);
};

const addToCart = async (userId, productId, quantity) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const error = new Error('Sản phẩm không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (product.stock <= 0) {
    const error = new Error('Sản phẩm đã hết hàng');
    error.statusCode = 400;
    throw error;
  }

  const cart = await _getOrCreateCart(userId);

  await prisma.$transaction(async (tx) => {
    const existingItem = await tx.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        const error = new Error(`Chỉ còn ${product.stock} sản phẩm`);
        error.statusCode = 400;
        throw error;
      }

      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      if (quantity > product.stock) {
        const error = new Error(`Chỉ còn ${product.stock} sản phẩm`);
        error.statusCode = 400;
        throw error;
      }

      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }
  });

  const updatedCart = await _getOrCreateCart(userId);
  return _formatCart(updatedCart);
};

const updateCartItem = async (userId, productId, quantity) => {
  const cart = await _getOrCreateCart(userId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: { cartId: cart.id, productId },
    },
    include: {
      product: true,
    },
  });

  if (!existingItem) {
    const error = new Error('Sản phẩm không có trong giỏ');
    error.statusCode = 404;
    throw error;
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({
      where: { id: existingItem.id },
    });
  } else {
    if (quantity > existingItem.product.stock) {
      const error = new Error(`Chỉ còn ${existingItem.product.stock} sản phẩm`);
      error.statusCode = 400;
      throw error;
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });
  }

  const updatedCart = await _getOrCreateCart(userId);
  return _formatCart(updatedCart);
};

const removeFromCart = async (userId, productId) => {
  const cart = await _getOrCreateCart(userId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: { cartId: cart.id, productId },
    },
  });

  if (!existingItem) {
    const error = new Error('Sản phẩm không có trong giỏ');
    error.statusCode = 404;
    throw error;
  }

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  const updatedCart = await _getOrCreateCart(userId);
  return _formatCart(updatedCart);
};

const clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    return { message: 'Đã xóa giỏ hàng' };
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return { message: 'Đã xóa giỏ hàng' };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
