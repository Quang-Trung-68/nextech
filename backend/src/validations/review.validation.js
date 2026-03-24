const { z } = require('zod');

/**
 * POST /api/reviews — tạo review mới
 */
const createReviewSchema = z.object({
  orderItemId: z.string({ required_error: 'orderItemId là bắt buộc' }).min(1),
  rating: z
    .number({ required_error: 'rating là bắt buộc', invalid_type_error: 'rating phải là số' })
    .int('rating phải là số nguyên')
    .min(1, 'rating tối thiểu là 1')
    .max(5, 'rating tối đa là 5'),
  comment: z.string().max(1000, 'comment tối đa 1000 ký tự').optional(),
});

/**
 * GET /api/products/:productId/reviews — query pagination
 */
const getProductReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

/**
 * DELETE /api/reviews/:reviewId — params
 */
const reviewParamsSchema = z.object({
  reviewId: z.string().min(1, 'reviewId không hợp lệ'),
});

/**
 * GET /api/products/:productId/reviews — params
 */
const productReviewsParamsSchema = z.object({
  productId: z.string().min(1, 'productId không hợp lệ'),
});

module.exports = {
  createReviewSchema,
  getProductReviewsQuerySchema,
  reviewParamsSchema,
  productReviewsParamsSchema,
};
