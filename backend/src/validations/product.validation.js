const { z } = require('zod');

/**
 * Schema validate body cho POST /products (tạo mới)
 */
const createProductSchema = z.object({
  name: z.string().min(2).max(200).trim(),

  description: z
    .string()
    .min(10, 'Mô tả tối thiểu 10 ký tự')
    .max(2000)
    .trim(),

  // z.coerce.number() để nhận cả string từ form-data
  price: z.coerce
    .number()
    .positive('Giá phải lớn hơn 0')
    .max(1_000_000_000, 'Giá không hợp lệ')
    .multipleOf(0.01, 'Giá tối đa 2 chữ số thập phân'),

  stock: z.coerce
    .number()
    .int('Số lượng phải là số nguyên')
    .min(0, 'Số lượng không được âm'),

  category: z.string().trim().min(1, 'Vui lòng chọn danh mục'),

  // optional vì ảnh có thể upload riêng qua Cloudinary
  images: z
    .array(z.string().url('URL ảnh không hợp lệ'))
    .min(1, 'Cần ít nhất 1 ảnh')
    .max(5, 'Tối đa 5 ảnh')
    .optional(),
});

/**
 * Schema validate body cho PUT /products/:id (cập nhật, PATCH-style)
 * Tất cả field đều optional, nhưng phải có ít nhất 1 field
 */
const updateProductSchema = createProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Cần ít nhất 1 trường để cập nhật' }
);

/**
 * Schema validate req.query cho GET /products
 */
const productQuerySchema = z
  .object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sort: z
      .enum(['price_asc', 'price_desc', 'newest', 'oldest'])
      .default('newest'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  })
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: 'minPrice không được lớn hơn maxPrice',
      path: ['minPrice'],
    }
  );

/**
 * Schema validate req.params cho các route có :id
 */
const productParamsSchema = z.object({
  id: z.string().cuid('ID sản phẩm không hợp lệ'),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productParamsSchema,
};
