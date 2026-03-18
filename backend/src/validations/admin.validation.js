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

const adminCreateProductSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().min(10, 'Mô tả tối thiểu 10 ký tự').max(2000).trim(),
  price: z.coerce.number().positive('Giá phải lớn hơn 0').max(1_000_000_000),
  stock: z.coerce.number().int('Số lượng phải là số nguyên').min(0),
  category: z.string().trim().min(1, 'Vui lòng chọn danh mục'),
  images: z.array(z.string().url('URL ảnh không hợp lệ')).min(1, 'Cần ít nhất 1 ảnh').max(5).optional(),
});

const adminUpdateProductSchema = adminCreateProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Cần ít nhất 1 trường để cập nhật' }
);

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
