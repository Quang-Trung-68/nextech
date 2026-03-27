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
 * VAT: dùng superRefine để tránh lỗi duplicate discriminator của z.union
 */
const createOrderSchema = z
  .object({
    shippingAddress: shippingAddressSchema,

    paymentMethod: z.enum(['COD', 'STRIPE', 'SEPAY'], {
      errorMap: () => ({ message: 'Phương thức thanh toán không hợp lệ (COD, STRIPE hoặc SEPAY)' }),
    }),

    couponCode: z
      .string()
      .trim()
      .min(1)
      .optional()
      .nullable(),

    // VAT fields — tất cả optional ở tầng object, validate chặt trong superRefine
    vatInvoiceRequested:    z.boolean().optional().default(false),
    vatBuyerType:           z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
    vatBuyerName:           z.string().optional(),
    vatBuyerAddress:        z.string().optional(),
    vatBuyerEmail:          z.string().optional(),
    vatBuyerCompany:        z.string().optional(),
    vatBuyerTaxCode:        z.string().optional(),
    vatBuyerCompanyAddress: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.vatInvoiceRequested) return;

    // INDIVIDUAL — name/address optional, backend fallback từ shippingAddress
    if (data.vatBuyerType === 'INDIVIDUAL') return;

    // COMPANY — 5 field bắt buộc
    if (data.vatBuyerType === 'COMPANY') {
      if (!data.vatBuyerName || data.vatBuyerName.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vui lòng nhập tên người đại diện', path: ['vatBuyerName'] });
      }
      if (!data.vatBuyerCompany || data.vatBuyerCompany.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vui lòng nhập tên công ty', path: ['vatBuyerCompany'] });
      }
      if (!data.vatBuyerTaxCode || !/^\d{10}(\d{3})?$/.test(data.vatBuyerTaxCode.trim())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mã số thuế không hợp lệ (10 hoặc 13 số)', path: ['vatBuyerTaxCode'] });
      }
      if (!data.vatBuyerCompanyAddress || data.vatBuyerCompanyAddress.trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vui lòng nhập địa chỉ công ty', path: ['vatBuyerCompanyAddress'] });
      }
      if (!data.vatBuyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.vatBuyerEmail.trim())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email công ty không hợp lệ', path: ['vatBuyerEmail'] });
      }
      return;
    }

    // vatInvoiceRequested = true nhưng không chọn loại → báo lỗi
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vui lòng chọn loại người mua (Cá nhân hoặc Công ty)',
      path: ['vatBuyerType'],
    });
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
