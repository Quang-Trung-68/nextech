import { z } from 'zod';

export const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: z
      .string()
      .trim()
      .min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' }),
    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84)[0-9]{9}$/, { message: 'Số điện thoại không hợp lệ' }),
    addressLine: z
      .string()
      .trim()
      .min(5, { message: 'Yêu cầu nhập Tên đường/phố' }),
    ward: z
      .string()
      .trim()
      .min(1, { message: 'Yêu cầu nhập Tên xã/phường' }),
    city: z
      .string()
      .trim()
      .min(1, { message: 'Yêu cầu nhập Tên tỉnh/thành phố' }),
  }),
  paymentMethod: z.enum(['COD', 'STRIPE']),
});
