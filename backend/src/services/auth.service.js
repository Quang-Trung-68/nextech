const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Create an access + refresh token pair, persist the refresh token to DB.
 * @param {object} user         Prisma User object
 * @param {{ ipAddress: string, userAgent: string }} meta
 * @returns {{ accessToken: string, refreshTokenData: { token: string, expiresAt: Date } }}
 */
const _createTokenPair = async (user, meta) => {
  const accessTokenData = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  const { token: refreshToken, expiresAt } = generateRefreshToken({
    userId: user.id,
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
      ipAddress: meta?.ipAddress || null,
      userAgent: meta?.userAgent || null,
    },
  });

  return {
    accessTokenData,
    refreshTokenData: { token: refreshToken, expiresAt },
  };
};

// ─── Public methods ───────────────────────────────────────────────────────────

const register = async (name, email, password, meta) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  const { accessTokenData, refreshTokenData } = await _createTokenPair(user, meta);

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessTokenData, refreshTokenData };
};

const login = async (email, password, meta) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately vague error — do not distinguish "bad email" vs "bad password"
  const authError = new Error('Invalid email or password');
  authError.statusCode = 401;

  if (!user) throw authError;

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw authError;

  const { accessTokenData, refreshTokenData } = await _createTokenPair(user, meta);

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessTokenData, refreshTokenData };
};

const refresh = async (refreshTokenFromCookie, meta) => {
  if (!refreshTokenFromCookie) {
    const error = new Error('No refresh token provided');
    error.statusCode = 401;
    throw error;
  }

  // 1. Verify JWT signature / expiry
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenFromCookie);
  } catch (err) {
    const error = new Error(
      err.name === 'TokenExpiredError'
        ? 'Refresh token has expired. Please log in again.'
        : 'Invalid refresh token'
    );
    error.statusCode = 401;
    throw error;
  }

  // 2. Check token has not been revoked
  const isRevoked = await prisma.revokedToken.findUnique({
    where: { token: refreshTokenFromCookie },
  });
  if (isRevoked) {
    const error = new Error('Token has been revoked. Please log in again.');
    error.statusCode = 401;
    throw error;
  }

  // 3. Check token exists in DB and has not expired at DB level
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenFromCookie },
  });
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    const error = new Error('Refresh token is invalid or expired');
    error.statusCode = 401;
    throw error;
  }

  // 4. Verify user still exists
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    const error = new Error('User no longer exists');
    error.statusCode = 401;
    throw error;
  }

  // 5. Rotate: delete old refresh token from DB
  await prisma.refreshToken.delete({ where: { token: refreshTokenFromCookie } });

  // 6. Issue new token pair
  const { accessTokenData, refreshTokenData } = await _createTokenPair(user, meta);

  return { accessTokenData, refreshTokenData };
};

const logout = async (refreshTokenFromCookie, userId) => {
  if (refreshTokenFromCookie) {
    // Delete from active tokens (ignore errors — token may already be gone)
    await prisma.refreshToken
      .delete({ where: { token: refreshTokenFromCookie } })
      .catch(() => {});

    // Add to revoked list so it can never be reused, even if presented again
    await prisma.revokedToken
      .create({
        data: {
          token: refreshTokenFromCookie,
          userId,
          reason: 'logout',
        },
      })
      .catch(() => {}); // Guard against duplicate inserts
  }

  return { message: 'Logged out successfully' };
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

// ─── Email Verification ───────────────────────────────────────────────────────

const { generateToken, hashToken } = require('../utils/token');
const { sendVerificationEmail, sendPasswordChangedEmail, sendPasswordResetEmail } = require('../utils/mailer');

/**
 * Generate and persist a new email verification token, then email it to the user.
 * Deletes any existing (un-expired) token first to keep only one active.
 * @param {object} user — from req.user (must include id, email, name)
 */
const sendEmailVerification = async (user) => {
  const { rawToken, hashedToken } = generateToken();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Overwrite any existing token with the new one (upsert-like via plain update + create)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken: hashedToken,
      emailVerifyTokenExpiry: expiry,
    },
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  await sendVerificationEmail(user.email, user.name, verifyUrl);
};

/**
 * Confirm an email address using the raw token from the URL.
 * @param {string} rawToken — received from query string
 */
const verifyEmail = async (rawToken) => {
  const hashed = hashToken(rawToken);

  const user = await prisma.user.findUnique({
    where: { emailVerifyToken: hashed },
  });

  if (!user) {
    const error = new Error('Token xác thực không hợp lệ hoặc đã được sử dụng.');
    error.statusCode = 400;
    throw error;
  }

  if (user.emailVerifyTokenExpiry < new Date()) {
    const error = new Error('Token xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email.');
    error.statusCode = 400;
    throw error;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyTokenExpiry: null,
    },
  });
};

// ─── Change Password ──────────────────────────────────────────────────────────

/**
 * Change the authenticated user's password.
 * Revokes ALL active refresh tokens (forces re-login on all devices).
 * Sends a "password changed" notification email.
 * @param {object} user         — from req.user
 * @param {string} newPassword  — plain text (validated by Zod before reaching here)
 */
const changePassword = async (user, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    // 1. Update password
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    // 2. Revoke all active refresh tokens (force re-login everywhere)
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);

  // Fire-and-forget notification
  await sendPasswordChangedEmail(user.email, user.name);
};

// ─── Forgot / Reset Password ──────────────────────────────────────────────────

/**
 * Initiate the forgot-password flow.
 * Always returns without error even if the email is not registered
 * (prevents user enumeration attacks).
 * @param {string} email — from request body
 */
const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Silently return — do not reveal whether the email exists
  if (!user) return;

  const { rawToken, hashedToken } = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete any previous reset token for this user, then create the new one
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    }),
  ]);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, user.name, resetUrl);
};

/**
 * Complete the password reset using the token from the email link.
 * On success:
 *  1. Marks the reset token as used
 *  2. Updates the user's password
 *  3. Revokes all active refresh tokens
 *  4. Sends a "password changed" notification email
 * @param {string} rawToken   — from request body
 * @param {string} newPassword — validated plain text password
 */
const resetPassword = async (rawToken, newPassword) => {
  const hashed = hashToken(rawToken);

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token: hashed },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.used) {
    const error = new Error('Token đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.');
    error.statusCode = 400;
    throw error;
  }

  if (tokenRecord.expiresAt < new Date()) {
    const error = new Error('Token đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại.');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    // 1. Mark token as used
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    }),
    // 2. Update password
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword },
    }),
    // 3. Revoke all active refresh tokens
    prisma.refreshToken.deleteMany({ where: { userId: tokenRecord.userId } }),
  ]);

  // Fire-and-forget notification
  await sendPasswordChangedEmail(tokenRecord.user.email, tokenRecord.user.name);
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  sendEmailVerification,
  verifyEmail,
  changePassword,
  forgotPassword,
  resetPassword,
};
