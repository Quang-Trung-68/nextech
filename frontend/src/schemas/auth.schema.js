import { z } from 'zod';

// ─── Login Schema ────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống'),
});

// ─── Register Schema ─────────────────────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z
      .string()
      .min(1, 'Email không được để trống')
      .email('Email không hợp lệ'),
    password: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .refine((val) => /[A-Z]/.test(val), 'Mật khẩu phải có ít nhất 1 chữ hoa')
      .refine((val) => /[a-z]/.test(val), 'Mật khẩu phải có ít nhất 1 chữ thường')
      .refine((val) => /[0-9]/.test(val), 'Mật khẩu phải có ít nhất 1 chữ số'),
    confirmPassword: z
      .string()
      .min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mật khẩu xác nhận không khớp',
        path: ['confirmPassword'],
      });
    }
  });
