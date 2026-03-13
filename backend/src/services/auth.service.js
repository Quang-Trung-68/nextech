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
  const { token: accessToken } = generateAccessToken({
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
    accessToken,
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

  const { accessToken, refreshTokenData } = await _createTokenPair(user, meta);

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshTokenData };
};

const login = async (email, password, meta) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately vague error — do not distinguish "bad email" vs "bad password"
  const authError = new Error('Invalid email or password');
  authError.statusCode = 401;

  if (!user) throw authError;

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw authError;

  const { accessToken, refreshTokenData } = await _createTokenPair(user, meta);

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, accessToken, refreshTokenData };
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
  const { accessToken, refreshTokenData } = await _createTokenPair(user, meta);

  return { accessToken, refreshTokenData };
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

module.exports = { register, login, refresh, logout, getMe };
