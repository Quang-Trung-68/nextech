const prisma = require('../utils/prisma');
const { getFinalPrice, getDiscountPercent, addPriceFields } = require('../utils/price');
const { NotFoundError, ConflictError, AppError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

const _getOrCreateCart = async (userId) => {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: {
      items: {
        include: {
          product: { include: { images: true } },
          variant: true,
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
    const { product, variant } = item;
    const hasVariants = product.hasVariants;

    let finalPrice;
    let stock;
    let discountPercent;

    if (hasVariants && variant) {
      finalPrice = Number(variant.price);
      stock = variant.stock;
      discountPercent = getDiscountPercent(product.price, product.salePrice);
    } else {
      finalPrice = getFinalPrice(product.price, product.salePrice);
      discountPercent = getDiscountPercent(product.price, product.salePrice);
      stock = product.stock;
    }

    const lineTotal = finalPrice * item.quantity;
    totalItems += item.quantity;
    cartTotal += lineTotal;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      finalPrice,
      discountPercent,
      image:
        variant?.imageUrl ||
        (product.images && product.images.length > 0 ? product.images[0].url : null),
      stock,
      quantity: item.quantity,
      lineTotal,
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

const _cartItemWhere = (cartId, productId, variantId) => ({
  cartId_productId_variantId: {
    cartId,
    productId,
    variantId: variantId ?? null,
  },
});

const getCart = async (userId) => {
  const cart = await _getOrCreateCart(userId);
  return _formatCart(cart);
};

const addToCart = async (userId, productId, quantity, variantId = null) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  if (product.hasVariants) {
    if (!variantId) {
      throw new AppError('Vui lòng chọn biến thể sản phẩm', 400, ERROR_CODES.PRODUCT.VARIANT_REQUIRED);
    }
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId, deletedAt: null },
    });
    if (!variant) {
      throw new NotFoundError('Variant');
    }
    if (variant.stock <= 0) {
      throw new ConflictError('Product is out of stock', ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK);
    }
  } else if (variantId) {
    throw new AppError('Sản phẩm này không có biến thể', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }

  const cart = await _getOrCreateCart(userId);

  await prisma.$transaction(async (tx) => {
    const existingItem = await tx.cartItem.findUnique({
      where: _cartItemWhere(cart.id, productId, variantId),
    });

    const maxStock = product.hasVariants
      ? (await tx.productVariant.findUnique({ where: { id: variantId } })).stock
      : product.stock;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > maxStock) {
        throw new ConflictError(
          `Only ${maxStock} items left in stock`,
          ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK
        );
      }

      await tx.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      if (quantity > maxStock) {
        throw new ConflictError(
          `Only ${maxStock} items left in stock`,
          ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK
        );
      }

      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null,
          quantity,
        },
      });
    }
  });

  const updatedCart = await _getOrCreateCart(userId);
  return _formatCart(updatedCart);
};

const updateCartItem = async (userId, productId, quantity, variantId = null) => {
  const cart = await _getOrCreateCart(userId);

  const existingItem = await prisma.cartItem.findUnique({
    where: _cartItemWhere(cart.id, productId, variantId),
    include: {
      product: true,
      variant: true,
    },
  });

  if (!existingItem) {
    throw new NotFoundError('Cart item');
  }

  const maxStock = existingItem.product.hasVariants
    ? existingItem.variant.stock
    : existingItem.product.stock;

  if (quantity === 0) {
    await prisma.cartItem.delete({
      where: { id: existingItem.id },
    });
  } else {
    if (quantity > maxStock) {
      throw new ConflictError(
        `Only ${maxStock} items left in stock`,
        ERROR_CODES.PRODUCT.PRODUCT_OUT_OF_STOCK
      );
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });
  }

  const updatedCart = await _getOrCreateCart(userId);
  return _formatCart(updatedCart);
};

const removeFromCart = async (userId, productId, variantId = null) => {
  const cart = await _getOrCreateCart(userId);

  const existingItem = await prisma.cartItem.findUnique({
    where: _cartItemWhere(cart.id, productId, variantId),
  });

  if (!existingItem) {
    throw new NotFoundError('Cart item');
  }

  await prisma.cartItem.delete({
    where: { id: existingItem.id },
  });

  const updatedCart = await _getOrCreateCart(userId);
  return _formatCart(updatedCart);
};

const clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    return { message: 'Cart cleared' };
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return { message: 'Cart cleared' };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
