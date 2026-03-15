const { z } = require('zod');

/**
 * Schema validate body cho POST /auth/register
 */
const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Tên tối thiểu 2 ký tự')
    .max(50, 'Tên tối đa 50 ký tự')
    .trim(),

  email: z
    .string()
    .email('Email không đúng định dạng')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .max(72, 'Mật khẩu tối đa 72 ký tự') // Giới hạn bcrypt
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mật khẩu phải có chữ hoa, chữ thường và số'
    ),
});

/**
 * Schema validate body cho POST /auth/login
 */
const loginSchema = z.object({
  email: z
    .string()
    .email('Email không đúng định dạng')
    .toLowerCase()
    .trim(),

  // Không validate format password ở đây để tránh leak thông tin
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

module.exports = { registerSchema, loginSchema };

// ─── Password strength regex (reused across schemas) ──────────────────────────
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const passwordField = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự')
  .regex(passwordRegex, 'Mật khẩu phải có chữ hoa, chữ thường và số');

/**
 * PATCH /auth/change-password
 */
const changePasswordSchema = z
  .object({
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

/**
 * POST /auth/forgot-password
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
});

/**
 * POST /auth/reset-password
 */
const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token không hợp lệ'),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
