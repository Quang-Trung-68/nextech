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
  district: z.string().min(1).trim(),
  city: z.string().min(1).trim(),
});

/**
 * Schema validate body cho POST /orders (tạo đơn hàng)
 */
const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,

  paymentMethod: z.enum(['COD', 'STRIPE'], {
    errorMap: () => ({ message: 'Phương thức thanh toán không hợp lệ' }),
  }),
});

/**
 * Schema validate body cho PUT /orders/:id/status (admin cập nhật trạng thái)
 * Nếu status = CANCELLED thì reason là bắt buộc (tối thiểu 10 ký tự)
 */
const updateOrderStatusSchema = z
  .object({
    status: z.enum(
      ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      {
        errorMap: () => ({ message: 'Trạng thái đơn hàng không hợp lệ' }),
      }
    ),

    // Lý do khi huỷ đơn (CANCELLED)
    reason: z.string().max(500).trim().optional(),
  })
  .refine(
    (data) =>
      data.status !== 'CANCELLED' ||
      (data.reason !== undefined && data.reason.length >= 10),
    {
      message: 'Vui lòng nhập lý do huỷ đơn (tối thiểu 10 ký tự)',
      path: ['reason'],
    }
  );

/**
 * Schema validate req.params cho các route có :id
 */
const orderParamsSchema = z.object({
  id: z.string().cuid('ID đơn hàng không hợp lệ'),
});

module.exports = {
  shippingAddressSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  orderParamsSchema,
};
