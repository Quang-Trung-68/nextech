const { z } = require('zod');

const createSupplierSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const updateSupplierSchema = createSupplierSchema.partial();

const createStockImportSchema = z.object({
  supplierId: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(),
  serials: z.array(z.string().min(1)).min(1),
  unitCost: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const listStockImportsQuerySchema = z.object({
  productId: z.string().cuid().optional(),
  supplierId: z.string().cuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const listSerialsQuerySchema = z.object({
  status: z.enum(['IN_STOCK', 'RESERVED', 'SOLD', 'RETURNED']).optional(),
  productId: z.string().cuid().optional(),
  variantId: z.string().cuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

const lookupSerialQuerySchema = z.object({
  q: z.string().min(1, 'Vui lòng nhập mã serial hoặc IMEI'),
});

const supplierParamsSchema = z.object({
  id: z.string().cuid(),
});

const stockImportParamsSchema = z.object({
  id: z.string().cuid(),
});

const productParamsForSerialsSchema = z.object({
  id: z.string().cuid(),
});

const listSuppliersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
});

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
  createStockImportSchema,
  listStockImportsQuerySchema,
  listSerialsQuerySchema,
  lookupSerialQuerySchema,
  supplierParamsSchema,
  stockImportParamsSchema,
  productParamsForSerialsSchema,
  listSuppliersQuerySchema,
};
