const prisma = require('../utils/prisma');
const ApiFeatures = require('../utils/apiFeatures');

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getProducts = async (queryParams) => {
  const features = new ApiFeatures(queryParams).search().filter().sort().paginate();
  const q = features.build();

  // Hỗ trợ thêm sort theo stock (không có trong ApiFeatures gốc)
  let orderBy = q.orderBy;
  if (queryParams.sort === 'stock_asc') orderBy = { stock: 'asc' };
  if (queryParams.sort === 'stock_desc') orderBy = { stock: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where: q.where, orderBy, skip: q.skip, take: q.take }),
    prisma.product.count({ where: q.where }),
  ]);

  return {
    products,
    pagination: {
      total,
      page: q.page,
      limit: q.take,
      totalPages: Math.ceil(total / q.take),
    },
  };
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { reviews: { include: { user: { select: { name: true } } } } },
  });
  if (!product) throw createError('Sản phẩm không tồn tại', 404);
  return product;
};

const createProduct = async (data) => {
  return prisma.product.create({ data });
};

const updateProduct = async (id, data) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw createError('Sản phẩm không tồn tại', 404);
  return prisma.product.update({ where: { id }, data });
};

const deleteProduct = async (id) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw createError('Sản phẩm không tồn tại', 404);

  // Kiểm tra sản phẩm đang nằm trong đơn hàng chưa DELIVERED
  const activeOrderItem = await prisma.orderItem.findFirst({
    where: {
      productId: id,
      order: {
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
    },
    include: { order: { select: { id: true, status: true } } },
  });

  if (activeOrderItem) {
    throw createError(
      `Không thể xoá sản phẩm đang có trong đơn hàng chưa hoàn thành (đơn #${activeOrderItem.order.id}, trạng thái: ${activeOrderItem.order.status})`,
      400
    );
  }

  return prisma.product.delete({ where: { id } });
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
