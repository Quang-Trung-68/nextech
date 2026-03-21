const { z } = require('zod');

/**
 * Sub-schema lồng cho địa chỉ giao hàng
 */
const shippingAddressSchema = z.object({
  fullName: z.string().min(2).max(100).trim(),

  phone: z
    .string()
    .regex(/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ'),

  addressLine: z.string().min(5).max(200).trim(),
  ward: z.string().min(1).trim(),
  city: z.string().min(1).trim(),
});

/**
 * Schema validate body cho POST /api/orders
 */
const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,

  paymentMethod: z.enum(['COD', 'STRIPE'], {
    errorMap: () => ({ message: 'Phương thức thanh toán không hợp lệ (COD hoặc STRIPE)' }),
  }),

  couponCode: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable(),
});

/**
 * Schema validate body cho PATCH /api/orders/:id/cancel (user tự huỷ)
 */
const cancelOrderSchema = z.object({
  reason: z
    .string({ required_error: 'Lý do huỷ đơn là bắt buộc' })
    .min(10, 'Lý do huỷ đơn tối thiểu 10 ký tự')
    .max(500)
    .trim(),
});

/**
 * Schema validate body cho PATCH /api/admin/orders/:id/status (admin cập nhật)
 * Flow hợp lệ: PROCESSING → SHIPPED → DELIVERED
 * Admin cũng có thể huỷ đơn: PENDING/PROCESSING → CANCELLED
 */
const adminUpdateOrderStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
    errorMap: () => ({
      message: 'Trạng thái không hợp lệ. Admin có thể cập nhật: PROCESSING → SHIPPED → DELIVERED, hoặc CANCELLED.',
    }),
  }),
  reason: z.string().trim().optional(),
});

/**
 * Schema validate req.query cho GET /api/orders (user xem lịch sử)
 */
const listMyOrdersQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
      errorMap: () => ({ message: 'Giá trị status không hợp lệ' }),
    })
    .or(z.literal(''))
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

/**
 * Schema validate req.query cho GET /api/admin/orders (admin xem tất cả)
 */
const adminListOrdersQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .or(z.literal(''))
    .optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).or(z.literal('')).optional(),
  search: z.string().trim().optional(),
  userId: z.string().cuid('userId không hợp lệ').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'totalAmount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/**
 * Schema validate req.params cho các route có :id
 */
const orderParamsSchema = z.object({
  id: z.string().cuid('ID đơn hàng không hợp lệ'),
});

module.exports = {
  shippingAddressSchema,
  createOrderSchema,
  cancelOrderSchema,
  adminUpdateOrderStatusSchema,
  listMyOrdersQuerySchema,
  adminListOrdersQuerySchema,
  orderParamsSchema,
};
