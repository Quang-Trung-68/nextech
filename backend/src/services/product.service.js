const prisma = require('../utils/prisma');
const ApiFeatures = require('../utils/apiFeatures');
const { addPriceFields, enrichVariantForStore } = require('../utils/price');
const { NotFoundError } = require('../errors/AppError');
const { generateUniqueProductSlug } = require('../utils/productSlugify');

const BRAND_INCLUDE = { brand: { select: { id: true, name: true, slug: true, logo: true } } };

const PRODUCT_DETAIL_INCLUDE = {
  images: true,
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  reviews: {
    include: {
      user: {
        select: { name: true },
      },
    },
  },
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
      include: { images: true, ...BRAND_INCLUDE },
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
    include: PRODUCT_DETAIL_INCLUDE,
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  const withPrices = addPriceFields(product);
  if (withPrices.variants?.length) {
    return {
      ...withPrices,
      variants: withPrices.variants.map((v) => enrichVariantForStore(withPrices, v)),
    };
  }
  return withPrices;
};

const getProductBySlug = async (slug) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: PRODUCT_DETAIL_INCLUDE,
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  const withPrices = addPriceFields(product);
  if (withPrices.variants?.length) {
    return {
      ...withPrices,
      variants: withPrices.variants.map((v) => enrichVariantForStore(withPrices, v)),
    };
  }
  return withPrices;
};

const TYPE_TO_CATEGORY = {
  phone: 'Điện thoại',
  laptop: 'Laptop',
  tablet: 'Máy tính bảng',
  accessories: 'Phụ kiện',
};

const getBrandsByType = async (type) => {
  if (type == null || type === '') {
    return prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, logo: true },
    });
  }

  const categoryFilter = TYPE_TO_CATEGORY[type]
    ? { category: TYPE_TO_CATEGORY[type] }
    : {};

  const brands = await prisma.brand.findMany({
    where: {
      products: {
        some: {
          stock: { gt: 0 },
          ...categoryFilter,
        },
      },
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, logo: true },
  });

  return brands;
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
      create: payload.images.map((url) => ({
        url,
        publicId: url.split('/').pop().split('.')[0] || 'unknown',
      })),
    };
  } else {
    delete payload.images;
  }
  return prisma.product.create({
    data: payload,
    include: { images: true, ...BRAND_INCLUDE },
  });
};

const updateProduct = async (id, data) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    throw new NotFoundError('Product');
  }

  const payload = { ...data };
  delete payload.brand;
  delete payload.slug;

  if (payload.name != null && payload.name !== existingProduct.name) {
    // Slug không tự đổi khi đổi tên (SEO)
  }

  if (payload.hasVariants === true) {
    payload.stock = 0;
  }
  if (payload.images) {
    payload.images = {
      deleteMany: {},
      create: payload.images.map((url) => ({
        url,
        publicId: url.split('/').pop().split('.')[0] || 'unknown',
      })),
    };
  }

  if (payload.salePrice === null) {
    payload.saleExpiresAt = null;
    payload.saleStock = null;
    payload.saleSoldCount = 0;
  }

  return prisma.product.update({
    where: { id },
    data: payload,
    include: { images: true, ...BRAND_INCLUDE },
  });
};

const deleteProduct = async (id) => {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    throw new NotFoundError('Product');
  }

  return prisma.product.delete({
    where: { id },
  });
};

const RELATED_LIST_INCLUDE = { images: true, ...BRAND_INCLUDE };

const getRelatedProducts = async (productId) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError('Product');
  }

  const exclude = [productId];
  let results = [];

  // Priority 1: cùng category + cùng brand
  if (product.brandId) {
    const p1 = await prisma.product.findMany({
      where: {
        category: product.category,
        brandId: product.brandId,
        id: { notIn: exclude },
      },
      orderBy: [{ saleSoldCount: 'desc' }, { rating: 'desc' }],
      take: 6,
      include: RELATED_LIST_INCLUDE,
    });
    results = p1;
    p1.forEach((p) => exclude.push(p.id));
  }

  // Priority 2: cùng category + price ±30%
  if (results.length < 6) {
    const price = Number(product.price);
    const p2 = await prisma.product.findMany({
      where: {
        category: product.category,
        price: { gte: price * 0.7, lte: price * 1.3 },
        id: { notIn: exclude },
      },
      orderBy: { saleSoldCount: 'desc' },
      take: 6 - results.length,
      include: RELATED_LIST_INCLUDE,
    });
    results = [...results, ...p2];
    p2.forEach((p) => exclude.push(p.id));
  }

  // Priority 3: fill đủ 6 cùng category
  if (results.length < 6) {
    const p3 = await prisma.product.findMany({
      where: { category: product.category, id: { notIn: exclude } },
      orderBy: [{ saleSoldCount: 'desc' }, { rating: 'desc' }],
      take: 6 - results.length,
      include: RELATED_LIST_INCLUDE,
    });
    results = [...results, ...p3];
  }

  return results.map(addPriceFields);
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  getBrandsByType,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
