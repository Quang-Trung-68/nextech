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
      .min(5, { message: 'Địa chỉ quá ngắn, vui lòng nhập rõ số nhà/đường' }),
    ward: z
      .string()
      .trim()
      .min(1, { message: 'Yêu cầu nhập Phường/Xã' }),
    district: z
      .string()
      .trim()
      .min(1, { message: 'Yêu cầu nhập Quận/Huyện' }),
    city: z
      .string()
      .trim()
      .min(1, { message: 'Yêu cầu nhập tên Tỉnh/Thành phố' }),
  }),
  paymentMethod: z.enum(['COD', 'STRIPE']),
});
