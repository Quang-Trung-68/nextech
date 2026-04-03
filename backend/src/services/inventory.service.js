const prisma = require('../utils/prisma');
const { AppError, NotFoundError, ConflictError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

/** Dùng cho tra cứu serial — đủ thông tin bán hàng / thanh toán / giao hàng (kể cả đơn huỷ) */
const SERIAL_INCLUDE = {
  product: { select: { id: true, name: true } },
  variant: { select: { id: true, sku: true } },
  stockImport: {
    include: {
      supplier: { select: { id: true, name: true, phone: true, email: true } },
      importedByUser: { select: { id: true, name: true, email: true } },
    },
  },
  orderItem: {
    include: {
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          paymentMethod: true,
          paymentStatus: true,
          totalAmount: true,
          discountAmount: true,
          shippingAddress: true,
          trackingCode: true,
          carrierName: true,
          trackingUrl: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
          coupon: { select: { id: true, code: true } },
        },
      },
    },
  },
};

async function createSupplier(data) {
  return prisma.supplier.create({ data });
}

async function getSuppliers({ search, page = 1, limit = 50 }) {
  const where = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
    prisma.supplier.count({ where }),
  ]);
  return { suppliers: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

async function updateSupplier(id, data) {
  const s = await prisma.supplier.findUnique({ where: { id } });
  if (!s) throw new NotFoundError('Supplier');
  return prisma.supplier.update({ where: { id }, data });
}

/**
 * @param {string} adminId
 * @param {{ supplierId: string, productId: string, variantId?: string|null, serials: string[], unitCost?: number|null, notes?: string|null }} data
 */
async function createStockImport(adminId, data) {
  const { supplierId, productId, variantId, serials, unitCost, notes } = data;
  const uniqueSerials = [...new Set(serials.map((s) => String(s).trim()).filter(Boolean))];
  if (uniqueSerials.length === 0) {
    throw new AppError('Danh sách serial không hợp lệ', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) throw new NotFoundError('Supplier');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product');

  if (product.hasVariants) {
    if (!variantId) {
      throw new AppError('Sản phẩm có biến thể — vui lòng chọn biến thể', 400, ERROR_CODES.PRODUCT.VARIANT_REQUIRED);
    }
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId, deletedAt: null },
    });
    if (!variant) throw new NotFoundError('Variant');
  } else if (variantId) {
    throw new AppError('Sản phẩm không có biến thể', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }

  const existing = await prisma.serialUnit.findMany({
    where: { serial: { in: uniqueSerials } },
    select: { serial: true },
  });
  if (existing.length > 0) {
    throw new ConflictError(
      `Serial đã tồn tại: ${existing.map((e) => e.serial).join(', ')}`,
      'SERIAL_DUPLICATE'
    );
  }

  const totalUnits = uniqueSerials.length;

  return prisma.$transaction(async (tx) => {
    const stockImport = await tx.stockImport.create({
      data: {
        supplierId,
        productId,
        variantId: variantId || null,
        importedBy: adminId,
        unitCost: unitCost != null ? unitCost : undefined,
        notes: notes || undefined,
        totalUnits,
        serialUnits: {
          create: uniqueSerials.map((serial) => ({
            serial,
            productId,
            variantId: variantId || null,
            status: 'IN_STOCK',
          })),
        },
      },
      include: {
        supplier: true,
        product: { select: { id: true, name: true } },
        variant: { select: { id: true, sku: true } },
        serialUnits: { take: 5 },
      },
    });

    if (variantId) {
      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: totalUnits } },
      });
    } else {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: totalUnits } },
      });
    }

    return stockImport;
  });
}

async function getStockImports({ productId, supplierId, page = 1, limit = 20 }) {
  const where = {};
  if (productId) where.productId = productId;
  if (supplierId) where.supplierId = supplierId;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.stockImport.findMany({
      where,
      orderBy: { importDate: 'desc' },
      skip,
      take: limit,
      include: {
        supplier: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        variant: { select: { id: true, sku: true } },
        importedByUser: { select: { id: true, name: true } },
      },
    }),
    prisma.stockImport.count({ where }),
  ]);
  return { stockImports: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

async function getStockImportById(id) {
  const row = await prisma.stockImport.findUnique({
    where: { id },
    include: {
      supplier: true,
      product: true,
      variant: true,
      importedByUser: { select: { id: true, name: true, email: true } },
      serialUnits: { orderBy: { serial: 'asc' } },
    },
  });
  if (!row) throw new NotFoundError('StockImport');
  return row;
}

async function getSerialUnits({ status, productId, variantId, search, page = 1, limit = 50 }) {
  const where = {};
  if (status) where.status = status;
  if (productId) where.productId = productId;
  if (variantId) where.variantId = variantId;
  if (search) {
    where.serial = { contains: search, mode: 'insensitive' };
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.serialUnit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        product: { select: { id: true, name: true } },
        variant: { select: { id: true, sku: true } },
        stockImport: {
          include: { supplier: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.serialUnit.count({ where }),
  ]);
  return { serials: items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

async function lookupSerial(q) {
  const serial = String(q || '').trim();
  if (!serial) {
    throw new AppError('Thiếu tham số serial', 400, ERROR_CODES.SERVER.VALIDATION_ERROR);
  }
  const unit = await prisma.serialUnit.findUnique({
    where: { serial },
    include: SERIAL_INCLUDE,
  });
  if (!unit) throw new NotFoundError('SerialUnit');
  return unit;
}

/**
 * Đếm IN_STOCK theo product / variant, so với lowStockThreshold.
 */
async function getLowStockReport() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      hasVariants: true,
      lowStockThreshold: true,
      stock: true,
    },
  });

  const variants = await prisma.productVariant.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      productId: true,
      sku: true,
      lowStockThreshold: true,
      stock: true,
      product: { select: { id: true, name: true } },
    },
  });

  const inStockCounts = await prisma.serialUnit.groupBy({
    by: ['productId', 'variantId'],
    where: { status: 'IN_STOCK' },
    _count: { _all: true },
  });

  const countMap = new Map();
  for (const row of inStockCounts) {
    const key = `${row.productId}|${row.variantId || ''}`;
    countMap.set(key, row._count._all);
  }

  const alerts = [];

  for (const p of products) {
    if (!p.hasVariants) {
      const cnt = countMap.get(`${p.id}|`) ?? countMap.get(`${p.id}|null`) ?? 0;
      if (cnt < p.lowStockThreshold) {
        alerts.push({
          type: 'product',
          productId: p.id,
          productName: p.name,
          variantId: null,
          sku: null,
          inStockSerialCount: cnt,
          aggregateStock: p.stock,
          threshold: p.lowStockThreshold,
        });
      }
    }
  }

  for (const v of variants) {
    const cnt = countMap.get(`${v.productId}|${v.id}`) ?? 0;
    if (cnt < v.lowStockThreshold) {
      alerts.push({
        type: 'variant',
        productId: v.productId,
        productName: v.product.name,
        variantId: v.id,
        sku: v.sku,
        inStockSerialCount: cnt,
        aggregateStock: v.stock,
        threshold: v.lowStockThreshold,
      });
    }
  }

  return { alerts };
}

async function getSerialsByProductId(productId) {
  const p = await prisma.product.findUnique({ where: { id: productId } });
  if (!p) throw new NotFoundError('Product');
  const serials = await prisma.serialUnit.findMany({
    where: { productId },
    orderBy: { serial: 'asc' },
    include: {
      variant: { select: { id: true, sku: true } },
      stockImport: { include: { supplier: { select: { name: true } } } },
    },
  });
  return { product: { id: p.id, name: p.name }, serials };
}

module.exports = {
  createSupplier,
  getSuppliers,
  updateSupplier,
  createStockImport,
  getStockImports,
  getStockImportById,
  getSerialUnits,
  lookupSerial,
  getLowStockReport,
  getSerialsByProductId,
};
