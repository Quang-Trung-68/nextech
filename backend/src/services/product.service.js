const prisma = require('../utils/prisma');
const ApiFeatures = require('../utils/apiFeatures');
const { addPriceFields } = require('../utils/price');

const getProducts = async (queryParams) => {
  const features = new ApiFeatures(queryParams)
    .search()
    .filter()
    .sort()
    .paginate();

  const queryDetails = features.build();

  const [products, totalCount] = await prisma.$transaction([
    prisma.product.findMany({
      where: queryDetails.where,
      orderBy: queryDetails.orderBy,
      skip: queryDetails.skip,
      take: queryDetails.take,
      include: { images: true }
    }),
    prisma.product.count({ where: queryDetails.where }),
  ]);

  const totalPages = Math.ceil(totalCount / queryDetails.limit);

  return {
    products: products.map(addPriceFields),
    totalCount,
    page: queryDetails.page,
    totalPages,
  };
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      reviews: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return addPriceFields(product);
};

const createProduct = async (data) => {
  const payload = { ...data };
  if (payload.images && payload.images.length > 0) {
    payload.images = {
      create: payload.images.map((url) => ({
        url,
        publicId: url.split('/').pop().split('.')[0] || 'unknown',
      })),
    };
  } else {
    delete payload.images;
  }
  return prisma.product.create({ data: payload, include: { images: true } });
};

const updateProduct = async (id, data) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const payload = { ...data };
  if (payload.images) {
    payload.images = {
      deleteMany: {},
      create: payload.images.map((url) => ({
        url,
        publicId: url.split('/').pop().split('.')[0] || 'unknown',
      })),
    };
  }

  return prisma.product.update({ where: { id }, data: payload, include: { images: true } });
};

const deleteProduct = async (id) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.product.delete({
    where: { id },
  });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
