const { z } = require('zod');

/**
 * Schema validate body cho POST /auth/register
 */
const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .trim(),

  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters') // Giới hạn bcrypt
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

/**
 * Schema validate body cho POST /auth/login
 */
const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),

  // Không validate format password ở đây để tránh leak thông tin
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };

// ─── Password strength regex (reused across schemas) ──────────────────────────
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

/**
 * PATCH /auth/change-password
 */
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * POST /auth/forgot-password
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase().trim(),
});

/**
 * POST /auth/reset-password
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
