const prisma = require('../utils/prisma');
const ApiFeatures = require('../utils/apiFeatures');

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
    }),
    prisma.product.count({ where: queryDetails.where }),
  ]);

  const totalPages = Math.ceil(totalCount / queryDetails.limit);

  return {
    products,
    totalCount,
    page: queryDetails.page,
    totalPages,
  };
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
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

  return product;
};

const createProduct = async (data) => {
  return prisma.product.create({
    data,
  });
};

const updateProduct = async (id, data) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.product.update({
    where: { id },
    data,
  });
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
