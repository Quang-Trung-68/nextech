const { z } = require('zod');

/**
 * POST /api/coupons/validate
 * User validate mã coupon trước khi checkout.
 */
const validateCouponSchema = z.object({
  code: z.string({ required_error: 'Mã giảm giá là bắt buộc' }).min(1, 'Mã giảm giá không được để trống').trim(),
  orderAmount: z
    .number({ required_error: 'Tổng tiền đơn hàng là bắt buộc', invalid_type_error: 'Tổng tiền đơn hàng phải là số' })
    .positive('Tổng tiền đơn hàng phải lớn hơn 0'),
});

/**
 * POST /api/coupons (admin tạo mã mới)
 */
const createCouponSchema = z.object({
  code: z
    .string({ required_error: 'Mã giảm giá là bắt buộc' })
    .min(1, 'Mã giảm giá không được để trống')
    .max(50)
    .trim(),

  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], {
    errorMap: () => ({ message: 'Loại giảm giá phải là PERCENTAGE hoặc FIXED_AMOUNT' }),
  }),

  value: z
    .number({ required_error: 'Giá trị giảm giá là bắt buộc', invalid_type_error: 'Giá trị giảm giá phải là số' })
    .positive('Giá trị giảm giá phải lớn hơn 0'),

  minOrderAmount: z
    .number({
      required_error: 'Giá trị đơn hàng tối thiểu là bắt buộc',
      invalid_type_error: 'Giá trị đơn hàng tối thiểu phải là số',
    })
    .nonnegative('Giá trị đơn hàng tối thiểu không được âm'),

  maxUsage: z
    .number({ required_error: 'Số lượt sử dụng tối đa là bắt buộc', invalid_type_error: 'Số lượt sử dụng phải là số' })
    .int('Số lượt sử dụng phải là số nguyên')
    .positive('Số lượt sử dụng phải lớn hơn 0'),

  expiresAt: z
    .string({ required_error: 'Ngày hết hạn là bắt buộc' })
    .datetime({ message: 'Ngày hết hạn không hợp lệ (định dạng ISO 8601)' }),

  maxDiscountAmount: z
    .number({ invalid_type_error: 'Giới hạn số tiền giảm phải là số' })
    .positive('Giới hạn số tiền giảm phải lớn hơn 0')
    .optional()
    .nullable(),
});

module.exports = { validateCouponSchema, createCouponSchema };
