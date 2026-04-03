const { z } = require('zod');

// ─── Stats ────────────────────────────────────────────────────────────────────

const statsQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month'], {
    errorMap: () => ({ message: 'period phải là day | week | month' }),
  }).optional().default('month'),
});

const revenueQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional().default(() => new Date().getFullYear()),
  month: z.string().optional().default('Tất cả'),
});

// ─── Admin Products ───────────────────────────────────────────────────────────

const adminProductQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'oldest', 'stock_asc', 'stock_desc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Base object (plain ZodObject — no .superRefine so .partial() works on it)
const adminProductBaseSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().min(10, 'Mô tả tối thiểu 10 ký tự').max(2000).trim(),
  price: z.coerce.number().positive('Giá phải lớn hơn 0').max(1_000_000_000),
  stock: z.coerce.number().int('Số lượng phải là số nguyên').min(0),
  category: z.string().trim().min(1, 'Vui lòng chọn danh mục'),
  brand: z.string().trim().optional(),
  images: z.array(z.object({
    url: z.string().url('URL ảnh không hợp lệ'),
    publicId: z.string().min(1)
  })).min(1, 'Cần ít nhất 1 ảnh').max(5),
  // Sale fields
  salePrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().positive().max(999_000_000).nullable().optional()
  ),
  saleExpiresAt: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : String(v)),
    z.string().nullable().optional()
  ),
  saleStock: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1).nullable().optional()
  ),
  isNewArrival: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  manufactureYear: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(2000).max(2100).nullable().optional()
  ),
  hasVariants: z.boolean().optional(),
});

const flashSaleRefine = (data, ctx) => {
  if (data.salePrice != null && data.price != null && data.salePrice >= data.price) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'salePrice must be < price', path: ['salePrice'] });
  }
  if (data.saleExpiresAt != null && data.salePrice == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'saleExpiresAt requires salePrice', path: ['saleExpiresAt'] });
  }
  if (data.saleStock != null && data.salePrice == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'saleStock requires salePrice', path: ['saleStock'] });
  }
};

const adminCreateProductSchema = adminProductBaseSchema.superRefine(flashSaleRefine);

const adminUpdateProductSchema = adminProductBaseSchema.partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Cần ít nhất 1 trường để cập nhật' });
  }
  flashSaleRefine(data, ctx);
});



const adminProductParamsSchema = z.object({
  id: z.string().cuid('ID sản phẩm không hợp lệ'),
});

// ─── Admin Users ──────────────────────────────────────────────────────────────

const adminUserQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  sortBy: z.enum(['createdAt', 'name', 'email']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const adminUserParamsSchema = z.object({
  id: z.string().cuid('ID người dùng không hợp lệ'),
});

const adminUserOrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

module.exports = {
  statsQuerySchema,
  revenueQuerySchema,
  adminProductQuerySchema,
  adminCreateProductSchema,
  adminUpdateProductSchema,
  adminProductParamsSchema,
  adminUserQuerySchema,
  adminUserParamsSchema,
  adminUserOrderQuerySchema,
};
