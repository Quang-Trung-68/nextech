import { z } from 'zod';

const shippingAddressSchema = z.object({
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
});

export const checkoutSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
    paymentMethod: z.enum(['COD', 'STRIPE', 'SEPAY']),

    // VAT fields — tất cả optional ở tầng object, validation chặt ở superRefine
    vatInvoiceRequested: z.boolean().optional(),
    vatBuyerType:        z.enum(['INDIVIDUAL', 'COMPANY']).optional(),
    vatBuyerName:        z.string().optional(),
    vatBuyerAddress:     z.string().optional(),
    vatBuyerEmail:       z.string().optional(),
    vatBuyerCompany:     z.string().optional(),
    vatBuyerTaxCode:     z.string().optional(),
    vatBuyerCompanyAddress: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Không xuất hóa đơn → không validate
    if (!data.vatInvoiceRequested) return;

    // Cá nhân — vatBuyerName/Address optional, không cần validate thêm
    if (data.vatBuyerType === 'INDIVIDUAL') return;

    // Công ty — validate 5 field bắt buộc
    if (data.vatBuyerType === 'COMPANY') {
      if (!data.vatBuyerName || data.vatBuyerName.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập tên người đại diện',
          path: ['vatBuyerName'],
        });
      }
      if (!data.vatBuyerCompany || data.vatBuyerCompany.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập tên công ty',
          path: ['vatBuyerCompany'],
        });
      }
      const mstRegex = /^\d{10}(\d{3})?$/;
      if (!data.vatBuyerTaxCode || !mstRegex.test(data.vatBuyerTaxCode.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Mã số thuế không hợp lệ (10 hoặc 13 số)',
          path: ['vatBuyerTaxCode'],
        });
      }
      if (!data.vatBuyerCompanyAddress || data.vatBuyerCompanyAddress.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng nhập địa chỉ công ty',
          path: ['vatBuyerCompanyAddress'],
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.vatBuyerEmail || !emailRegex.test(data.vatBuyerEmail.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Email công ty không hợp lệ',
          path: ['vatBuyerEmail'],
        });
      }
    }
  });
