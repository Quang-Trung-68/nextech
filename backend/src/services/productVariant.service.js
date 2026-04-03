const prisma = require('../utils/prisma');
const { NotFoundError, AppError, ConflictError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');
const { getCategoryCode, generateSku } = require('../utils/sku');

async function _getProductOrThrow(productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product');
  return product;
}

/**
 * Tìm SKU chưa dùng (kể cả bản ghi đã soft-delete vẫn giữ sku unique).
 */
async function _allocateUniqueSku(tx, categoryCode, productId) {
  for (let i = 1; i < 100000; i += 1) {
    const sku = generateSku(categoryCode, productId, i);
    const taken = await tx.productVariant.findUnique({ where: { sku } });
    if (!taken) return sku;
  }
  throw new AppError('Cannot allocate SKU', 500, ERROR_CODES.SERVER.INTERNAL_SERVER_ERROR);
}

async function getAttributes(productId) {
  await _getProductOrThrow(productId);
  return prisma.productAttribute.findMany({
    where: { productId },
    orderBy: { position: 'asc' },
    include: {
      values: { orderBy: { position: 'asc' } },
    },
  });
}

async function upsertAttributes(productId, { attributes }) {
  await _getProductOrThrow(productId);

  return prisma.$transaction(async (tx) => {
    await tx.productAttribute.deleteMany({ where: { productId } });

    for (let ai = 0; ai < attributes.length; ai += 1) {
      const a = attributes[ai];
      await tx.productAttribute.create({
        data: {
          productId,
          name: a.name,
          position: a.position ?? ai,
          values: {
            create: a.values.map((v, vi) => ({
              value: v.value,
              position: v.position ?? vi,
            })),
          },
        },
      });
    }

    return tx.productAttribute.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
      include: { values: { orderBy: { position: 'asc' } } },
    });
  });
}

async function _validateVariantRow(tx, productId, attributeValueIds) {
  const attrCount = await tx.productAttribute.count({ where: { productId } });
  if (attrCount === 0) {
    throw new AppError('Product has no attributes', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }
  if (attributeValueIds.length !== attrCount) {
    throw new AppError(
      `Mỗi biến thể cần đúng ${attrCount} giá trị thuộc tính`,
      400,
      ERROR_CODES.SERVER.VALIDATION_ERROR
    );
  }

  const values = await tx.productAttributeValue.findMany({
    where: { id: { in: attributeValueIds } },
    include: { attribute: true },
  });

  if (values.length !== attributeValueIds.length) {
    throw new NotFoundError('Attribute value');
  }

  const seenAttr = new Set();
  for (const v of values) {
    if (v.attribute.productId !== productId) {
      throw new AppError('Invalid attribute value for this product', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
    }
    if (seenAttr.has(v.attributeId)) {
      throw new AppError('Duplicate attribute in variant row', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
    }
    seenAttr.add(v.attributeId);
  }

  if (seenAttr.size !== attrCount) {
    throw new AppError('Each variant must include one value per attribute', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }
}

async function getVariants(productId) {
  await _getProductOrThrow(productId);
  return prisma.productVariant.findMany({
    where: { productId, deletedAt: null },
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
  });
}

async function upsertVariants(productId, { variants }) {
  const product = await _getProductOrThrow(productId);
  const categoryCode = getCategoryCode(product.category);

  return prisma.$transaction(async (tx) => {
    await tx.productVariant.updateMany({
      where: { productId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    const created = [];
    for (const row of variants) {
      await _validateVariantRow(tx, productId, row.attributeValueIds);

      const sku = await _allocateUniqueSku(tx, categoryCode, productId);
      const imageUrl =
        row.imageUrl === '' || row.imageUrl === undefined ? null : row.imageUrl ?? null;

      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku,
          price: row.price,
          stock: row.stock,
          imageUrl,
          values: {
            create: row.attributeValueIds.map((attributeValueId) => ({
              attributeValueId,
            })),
          },
        },
        include: {
          values: {
            include: {
              attributeValue: {
                include: { attribute: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });
      created.push(variant);
    }

    await tx.product.update({
      where: { id: productId },
      data: { hasVariants: true, stock: 0 },
    });

    return created;
  });
}

async function updateVariantByAdmin(productId, variantId, data) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId, deletedAt: null },
  });
  if (!variant) throw new NotFoundError('Variant');

  const payload = { ...data };
  if (payload.imageUrl === '') payload.imageUrl = null;

  if (payload.sku && payload.sku !== variant.sku) {
    const taken = await prisma.productVariant.findUnique({ where: { sku: payload.sku } });
    if (taken && taken.id !== variantId) {
      throw new ConflictError('SKU đã tồn tại', ERROR_CODES.PRODUCT.SKU_ALREADY_EXISTS);
    }
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data: payload,
    include: {
      values: {
        include: {
          attributeValue: {
            include: { attribute: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
}

async function deleteVariantByAdmin(productId, variantId) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId, deletedAt: null },
  });
  if (!variant) throw new NotFoundError('Variant');

  await prisma.productVariant.update({
    where: { id: variantId },
    data: { deletedAt: new Date() },
  });

  const remaining = await prisma.productVariant.count({
    where: { productId, deletedAt: null },
  });
  if (remaining === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { hasVariants: false },
    });
  }

  return { success: true };
}

async function getVariantById(variantId) {
  return prisma.productVariant.findFirst({
    where: { id: variantId, deletedAt: null },
    include: { product: true },
  });
}

async function updateVariantStock(tx, variantId, delta) {
  return tx.productVariant.update({
    where: { id: variantId },
    data: { stock: { increment: delta } },
  });
}

module.exports = {
  getAttributes,
  upsertAttributes,
  getVariants,
  upsertVariants,
  updateVariantByAdmin,
  deleteVariantByAdmin,
  getVariantById,
  updateVariantStock,
};
