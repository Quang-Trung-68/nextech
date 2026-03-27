const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AppError, AuthenticationError, ConflictError, NotFoundError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

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
    throw new ConflictError('Email is already registered', ERROR_CODES.AUTH.ACCOUNT_ALREADY_EXISTS);
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
  const authError = new AuthenticationError('Invalid email or password', ERROR_CODES.AUTH.INVALID_CREDENTIALS);

  if (!user) throw authError;

  // Guard: OAuth-only accounts have no password set
  if (!user.password) {
    throw new AppError(
      'This account uses social login. Please use Login with Google.',
      400,
      ERROR_CODES.AUTH.INVALID_CREDENTIALS
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw authError;

  const { accessTokenData, refreshTokenData } = await _createTokenPair(user, meta);

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessTokenData, refreshTokenData };
};

const refresh = async (refreshTokenFromCookie, meta) => {
  if (!refreshTokenFromCookie) {
    throw new AuthenticationError('No refresh token provided', ERROR_CODES.AUTH.TOKEN_MISSING);
  }

  // 1. Verify JWT signature / expiry
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenFromCookie);
  } catch (err) {
    throw new AuthenticationError(
      err.name === 'TokenExpiredError'
        ? 'Refresh token has expired. Please log in again.'
        : 'Invalid refresh token',
      err.name === 'TokenExpiredError' ? ERROR_CODES.AUTH.TOKEN_EXPIRED : ERROR_CODES.AUTH.TOKEN_INVALID
    );
  }

  // 2. Check token has not been revoked
  const isRevoked = await prisma.revokedToken.findUnique({
    where: { token: refreshTokenFromCookie },
  });
  if (isRevoked) {
    throw new AuthenticationError('Token has been revoked. Please log in again.', ERROR_CODES.AUTH.TOKEN_INVALID);
  }

  // 3. Check token exists in DB and has not expired at DB level
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenFromCookie },
  });
  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new AuthenticationError('Refresh token is invalid or expired', ERROR_CODES.AUTH.TOKEN_INVALID);
  }

  // 4. Verify user still exists
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new AuthenticationError('User no longer exists', ERROR_CODES.AUTH.INVALID_CREDENTIALS);
  }

  // 5. Rotate: delete old refresh token from DB
  // deleteMany avoids throwing P2025 in race-condition scenarios (another refresh rotated the token already),
  // and lets us translate it into a proper 401 AuthenticationError.
  const deleteResult = await prisma.refreshToken.deleteMany({
    where: { token: refreshTokenFromCookie },
  });
  if (deleteResult.count !== 1) {
    throw new AuthenticationError(
      'Refresh token is invalid or expired',
      ERROR_CODES.AUTH.TOKEN_INVALID
    );
  }

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
    throw new NotFoundError('User');
  }

  return user;
};

// ─── Email Verification ───────────────────────────────────────────────────────

const { generateToken, hashToken } = require('../utils/token');
const emailJob = require('../jobs/emailJob');

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
  emailJob.dispatchVerificationEmail(user.email, { name: user.name, verifyUrl });
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
    throw new AppError('Invalid or already used verification token.', 400, ERROR_CODES.AUTH.TOKEN_INVALID);
  }

  if (user.emailVerifyTokenExpiry < new Date()) {
    throw new AppError('Verification token has expired. Please request a new one.', 400, ERROR_CODES.AUTH.TOKEN_EXPIRED);
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
 * @param {object} meta         — meta data { ipAddress, userAgent }
 */
const changePassword = async (user, currentPassword, newPassword, meta) => {
  // Guard: OAuth-only accounts have no password — use "set password" flow instead
  if (!user.password) {
    throw new AppError(
      'OAuth account does not have a password. Please use Set Password feature.',
      400,
      ERROR_CODES.AUTH.INVALID_CREDENTIALS
    );
  }

  // Verify current password before allowing change
  if (!currentPassword) {
    throw new AppError('Current password is required.', 400, ERROR_CODES.AUTH.INVALID_CREDENTIALS);
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new AppError('Current password is incorrect.', 400, ERROR_CODES.AUTH.INVALID_CREDENTIALS);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from current password.', 400, ERROR_CODES.AUTH.INVALID_CREDENTIALS);
  }

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
  emailJob.dispatchPasswordChangedEmail(user.email, { name: user.name, meta });
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

  const crypto = require('crypto');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

  // Delete any previous reset token for this user, then create the new one
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
        used: false,
      },
    }),
  ]);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  emailJob.dispatchResetPasswordEmail(user.email, { name: user.name, resetUrl });
};

/**
 * Complete the password reset using the token from the email link.
 * @param {string} rawToken   — from request body
 * @param {string} newPassword — validated plain text password
 * @param {object} meta        — meta data { ipAddress, userAgent }
 */
const resetPassword = async (rawToken, newPassword, meta) => {
  const crypto = require('crypto');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!tokenRecord) {
    throw new AppError('Invalid token', 400, ERROR_CODES.AUTH.TOKEN_INVALID);
  }

  if (tokenRecord.used) {
    throw new AppError('Token has already been used', 400, ERROR_CODES.AUTH.TOKEN_INVALID);
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new AppError('Token has expired', 400, ERROR_CODES.AUTH.TOKEN_EXPIRED);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    // a. Update User: { password: hashedPassword }
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword },
    }),
    // b. Update PasswordResetToken: { used: true }
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    }),
    // c. DeleteMany RefreshToken của userId này
    prisma.refreshToken.deleteMany({ where: { userId: tokenRecord.userId } }),
  ]);

  // Fire-and-forget notification
  emailJob.dispatchPasswordChangedEmail(tokenRecord.user.email, { 
    name: tokenRecord.user.name, 
    meta 
  });
};

// ─── OAuth ────────────────────────────────────────────────────────────────────

/**
 * Find or create a user from an OAuth provider callback.
 * Generic: works for any provider (google, github, facebook…).
 *
 * Logic:
 *  STEP 1 — Lookup OAuthAccount by (provider + providerAccountId)
 *           → Found: return the linked user immediately (happy path)
 *  STEP 2 — Lookup User by email
 *           → Found: link a new OAuthAccount to existing user
 *           → Not found: create User (password=null) + OAuthAccount atomically
 *
 * @param {{ provider: string, providerAccountId: string, email: string, name: string }} params
 * @returns {Promise<object>} Prisma User object
 */
const findOrCreateOAuthUser = async ({ provider, providerAccountId, email, name }) => {
  // ── STEP 1: Find existing OAuthAccount ──────────────────────────────────────
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
    include: { user: true },
  });

  if (existingOAuth) {
    return existingOAuth.user; // Happy path — user already linked
  }

  // ── STEP 2: No OAuthAccount yet — check by email ────────────────────────────
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    // Auto-link: user registered manually before; Google has verified the email
    await prisma.oAuthAccount.create({
      data: {
        userId: existingUser.id,
        provider,
        providerAccountId,
      },
    });

    return existingUser;
  }

  // ── STEP 2b: Brand-new user — create User + OAuthAccount atomically ──────────
  const [newUser] = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: null,       // OAuth users have no password
        isEmailVerified: true, // Provider has already verified the email
      },
    });

    await tx.oAuthAccount.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId,
      },
    });

    return [user];
  });

  return newUser;
};

/**
 * Issue a fresh access + refresh token pair for an already-authenticated user.
 * Reused by both login() and OAuth callback controllers.
 * @param {object} user   Prisma User object
 * @param {object} meta   { ipAddress, userAgent }
 */
const issueTokens = async (user, meta) => {
  return _createTokenPair(user, meta);
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
  findOrCreateOAuthUser,
  issueTokens,
};
