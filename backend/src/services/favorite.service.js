const prisma = require('../utils/prisma');
const { addPriceFields } = require('../utils/price');
const { NotFoundError } = require('../errors/AppError');

const toggleFavorite = async (userId, productId) => {
  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      // If it exists, delete it -> return favorited: false
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return { favorited: false };
    }

    // If it does not exist, create it -> return favorited: true
    await prisma.favorite.create({
      data: { userId, productId },
    });
    return { favorited: true };
  } catch (error) {
    // If the product does not exist, Prisma throws P2003
    if (error.code === 'P2003') {
      throw new NotFoundError('Product');
    }
    throw error;
  }
};

const getUserFavorites = async (userId) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        include: {
          images: {
            take: 1,
          },
          brand: { select: { name: true } },
        },
      },
    },
  });

  // Map to product objects
  return favorites.map((f) => {
    const productWithPrices = addPriceFields(f.product);
    return {
      id: productWithPrices.id,
      name: productWithPrices.name,
      price: productWithPrices.price,
      salePrice: productWithPrices.salePrice,
      discountPercent: productWithPrices.discountPercent,
      finalPrice: productWithPrices.finalPrice,
      images: productWithPrices.images,
      category: productWithPrices.category,
      brand: productWithPrices.brand?.name ?? null,
      rating: productWithPrices.rating,
      numReviews: productWithPrices.numReviews,
      isNewArrival: productWithPrices.isNewArrival,
    };
  });
};

const getFavoriteStatus = async (userId, productIds) => {
  if (!userId || !productIds || productIds.length === 0) {
    return {};
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      productId: { in: productIds },
    },
  });

  const statusMap = {};
  favorites.forEach((f) => {
    statusMap[f.productId] = true;
  });

  return statusMap;
};

module.exports = {
  toggleFavorite,
  getUserFavorites,
  getFavoriteStatus,
};
