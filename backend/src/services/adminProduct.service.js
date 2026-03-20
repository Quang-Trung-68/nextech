const prisma = require('../utils/prisma');
const ApiFeatures = require('../utils/apiFeatures');
const { addPriceFields } = require('../utils/price');

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
    prisma.product.findMany({ 
      where: q.where, 
      orderBy, 
      skip: q.skip, 
      take: q.take,
      include: { images: true }
    }),
    prisma.product.count({ where: q.where }),
  ]);

  return {
    products: products.map(addPriceFields),
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
    include: { images: true, reviews: { include: { user: { select: { name: true } } } } },
  });
  if (!product) throw createError('Sản phẩm không tồn tại', 404);
  return addPriceFields(product);
};

const createProduct = async (data) => {
  const payload = { ...data };
  if (payload.images && payload.images.length > 0) {
    payload.images = {
      create: payload.images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      })),
    };
  } else {
    delete payload.images; // Nếu mảng rỗng thì bỏ qua field này
  }
  return prisma.product.create({ data: payload, include: { images: true } });
};

const updateProduct = async (id, data) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw createError('Sản phẩm không tồn tại', 404);

  // Task 6: Validate salePrice < price
  const priceToCheck = data.price != null ? parseFloat(data.price) : parseFloat(existing.price);
  if (data.salePrice != null) {
    const salePriceVal = parseFloat(data.salePrice);
    if (salePriceVal >= priceToCheck) {
      throw createError('Giá khuyến mãi phải nhỏ hơn giá gốc', 400);
    }
  }

  const payload = { ...data };
  if (payload.images) {
    payload.images = {
      deleteMany: {},
      create: payload.images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      })),
    };
  }

  const updated = await prisma.product.update({ where: { id }, data: payload, include: { images: true } });
  return addPriceFields(updated);
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
