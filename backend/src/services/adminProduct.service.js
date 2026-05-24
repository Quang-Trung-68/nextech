const prisma = require('../utils/prisma');
const ApiFeatures = require('../utils/apiFeatures');
const { addPriceFields } = require('../utils/price');
const { AppError, NotFoundError, ConflictError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');
const { generateUniqueProductSlug } = require('../utils/productSlugify');

const BRAND_SELECT = { brand: { select: { id: true, name: true, slug: true, logo: true } } };
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
      include: { images: true, ...BRAND_SELECT }
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

const VARIANT_INCLUDE = {
  attributes: {
    orderBy: { position: 'asc' },
    include: { values: { orderBy: { position: 'asc' } } },
  },
  variants: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      values: {
        include: {
          attributeValue: {
            include: { attribute: { select: { id: true, name: true } } },
          },
        },
      },
    },
  },
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      ...BRAND_SELECT,
      reviews: { include: { user: { select: { name: true } } } },
      ...VARIANT_INCLUDE,
    },
  });
  if (!product) throw new NotFoundError('Product');
  return addPriceFields(product);
};

const createProduct = async (data) => {
  const payload = { ...data };
  delete payload.brand;
  delete payload.slug;
  payload.slug = await generateUniqueProductSlug(prisma, payload.name);
  if (payload.hasVariants) {
    payload.stock = 0;
  }
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
  return prisma.product.create({
    data: payload,
    include: { images: true, ...BRAND_SELECT, ...VARIANT_INCLUDE },
  });
};

const triggerWishlistPriceDropAlerts = async (productId, oldPrice, newPrice, product) => {
  try {
    const NotificationService = require('./notification.service');
    const EmailService = require('./email.service');
    
    const favorites = await prisma.favorite.findMany({
      where: { productId },
      include: { user: true },
    });
    
    if (!favorites.length) return;
    
    const CATEGORY_TO_SLUG = {
      'Điện thoại': 'phone',
      'Laptop': 'laptop',
      'Máy tính bảng': 'tablet',
      'Phụ kiện': 'accessories',
    };
    const getSlugByCategory = (category) => CATEGORY_TO_SLUG[category] || 'phone';
    
    const productUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${getSlugByCategory(product.category)}/${product.slug}`;
    const formatVND = (amount) => Math.round(Number(amount)).toLocaleString('vi-VN') + ' đ';
    
    const title = `⚡ Giá cực sốc: ${product.name} giảm giá!`;
    const message = `Sản phẩm trong danh sách yêu thích của bạn vừa giảm giá từ ${formatVND(oldPrice)} xuống còn ${formatVND(newPrice)}. Mua ngay kẻo lỡ!`;
    
    const promises = favorites.map(async (fav) => {
      if (!fav.user) return;
      
      // 1. Gửi thông báo DB & push socket.io (Soketi)
      try {
        await NotificationService.createAndSend(
          fav.userId,
          'wishlist_price_drop',
          title,
          message,
          { productId, oldPrice, newPrice, slug: product.slug, category: product.category }
        );
      } catch (err) {
        console.error(`[WishlistAlert] Failed to send WS/DB notification to user ${fav.userId}:`, err);
      }
      
      // 2. Gửi Email thông qua Nodemailer
      try {
        if (fav.user.email) {
          await EmailService.sendWishlistPriceDropEmail(fav.user.email, {
            name: fav.user.name,
            productName: product.name,
            oldPrice,
            newPrice,
            productUrl,
          });
        }
      } catch (err) {
        console.error(`[WishlistAlert] Failed to send price drop email to user ${fav.user.email}:`, err);
      }
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('[WishlistAlert] Error in triggerWishlistPriceDropAlerts:', error);
  }
};

const updateProduct = async (id, data) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product');

  // Khởi tạo các trường giá trước khi cập nhật
  const oldProduct = addPriceFields(existing);
  const oldEffectivePrice = oldProduct.effectivePrice;

  // Task 6: Validate salePrice < price
  const priceToCheck = data.price != null ? parseFloat(data.price) : parseFloat(existing.price);
  if (data.salePrice != null) {
    const salePriceVal = parseFloat(data.salePrice);
    if (salePriceVal >= priceToCheck) {
      throw new AppError('Sale price must be less than original price', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
    }
  }

  const payload = { ...data };
  delete payload.brand;
  delete payload.slug;
  if (payload.hasVariants === true) {
    payload.stock = 0;
  }
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

  const updated = await prisma.product.update({
    where: { id },
    data: payload,
    include: { images: true, ...BRAND_SELECT, ...VARIANT_INCLUDE },
  });

  const newProduct = addPriceFields(updated);
  const newEffectivePrice = newProduct.effectivePrice;

  // Nếu giá thực tế mới rẻ hơn giá thực tế cũ, kích hoạt sự kiện thông báo giảm giá
  if (newEffectivePrice < oldEffectivePrice) {
    triggerWishlistPriceDropAlerts(id, oldEffectivePrice, newEffectivePrice, newProduct).catch((err) => {
      console.error('[WishlistAlert] Failed to trigger wishlist alerts:', err);
    });
  }

  return newProduct;
};


const regenerateProductSlug = async (id) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product');
  const newSlug = await generateUniqueProductSlug(prisma, existing.name, id);
  const updated = await prisma.product.update({
    where: { id },
    data: { slug: newSlug },
    include: { images: true, ...BRAND_SELECT, ...VARIANT_INCLUDE },
  });
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
        status: { notIn: ['COMPLETED', 'CANCELLED', 'RETURNED'] },
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

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  regenerateProductSlug,
  deleteProduct,
};
