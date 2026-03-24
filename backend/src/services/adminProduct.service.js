const prisma = require('../utils/prisma');
const ApiFeatures = require('../utils/apiFeatures');
const { addPriceFields } = require('../utils/price');
const { AppError, NotFoundError, ConflictError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');
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
  if (!product) throw new NotFoundError('Product');
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
  if (!existing) throw new NotFoundError('Product');

  // Task 6: Validate salePrice < price
  const priceToCheck = data.price != null ? parseFloat(data.price) : parseFloat(existing.price);
  if (data.salePrice != null) {
    const salePriceVal = parseFloat(data.salePrice);
    if (salePriceVal >= priceToCheck) {
      throw new AppError('Sale price must be less than original price', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
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

  // Reset flash sale fields if salePrice is explicitly cleared
  if (payload.salePrice === null) {
    payload.saleExpiresAt = null;
    payload.saleStock = null;
    payload.saleSoldCount = 0;
  } else if (payload.salePrice !== undefined) {
    // Nếu cập nhật thông tin sale mới (giá, số lượng, hoặc thời gian), ta reset số lượng đã bán
    const existingPrice = existing.salePrice ? parseFloat(existing.salePrice) : null;
    const newPrice = payload.salePrice ? parseFloat(payload.salePrice) : null;
    
    const existingDate = existing.saleExpiresAt ? existing.saleExpiresAt.toISOString() : null;
    const newDate = payload.saleExpiresAt ? new Date(payload.saleExpiresAt).toISOString() : null;
    
    if (
      newPrice !== existingPrice ||
      newDate !== existingDate ||
      payload.saleStock !== existing.saleStock
    ) {
      payload.saleSoldCount = 0;
    }
  }

  const updated = await prisma.product.update({ where: { id }, data: payload, include: { images: true } });
  return addPriceFields(updated);
};

const deleteProduct = async (id) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product');

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
    throw new ConflictError(
      `Cannot delete product because it is in an uncompleted order (order #${activeOrderItem.order.id}, status: ${activeOrderItem.order.status})`,
      'CONFLICT'
    );
  }

  return prisma.product.delete({ where: { id } });
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
