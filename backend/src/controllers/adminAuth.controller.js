const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} = require('../utils/cookie');
const { AuthenticationError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

const _getMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new AuthenticationError('Invalid email or password', ERROR_CODES.AUTH.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password', ERROR_CODES.AUTH.INVALID_CREDENTIALS);
    }

    if (!admin.isActive) {
      throw new AuthenticationError('Account is deactivated', ERROR_CODES.AUTH.ACCOUNT_DEACTIVATED);
    }

    const { token: accessToken, expiresAt: accessExpiresAt } = generateAccessToken({
      adminId: admin.id,
      type: 'ADMIN',
    });

    const { token: refreshToken, expiresAt: refreshExpiresAt } = generateRefreshToken({
      adminId: admin.id,
      type: 'ADMIN',
    });

    const meta = _getMeta(req);
    await prisma.adminRefreshToken.create({
      data: {
        token: refreshToken,
        adminId: admin.id,
        expiresAt: refreshExpiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    // isAdmin = true
    setAccessTokenCookie(res, accessToken, accessExpiresAt, true);
    setRefreshTokenCookie(res, refreshToken, refreshExpiresAt, true);

    const safeAdmin = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      avatar: admin.avatar,
      role: 'ADMIN', // For frontend compatibility
    };

    res.status(200).json({ success: true, user: safeAdmin });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies['admin_refresh_token'];
    if (!refreshToken) {
      return next(new AuthenticationError('No refresh token in cookie. Please log in.', ERROR_CODES.AUTH.TOKEN_MISSING));
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AuthenticationError('Invalid or expired refresh token', ERROR_CODES.AUTH.INVALID_TOKEN);
    }

    if (decoded.type !== 'ADMIN') {
      throw new AuthenticationError('Invalid token type', ERROR_CODES.AUTH.INVALID_TOKEN);
    }

    const existingToken = await prisma.adminRefreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!existingToken) {
      await prisma.adminRefreshToken.deleteMany({ where: { adminId: decoded.adminId } });
      throw new AuthenticationError('Refresh token reuse detected. All sessions revoked.', ERROR_CODES.AUTH.INVALID_TOKEN);
    }

    await prisma.adminRefreshToken.delete({ where: { token: refreshToken } });

    if (existingToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired', ERROR_CODES.AUTH.TOKEN_EXPIRED);
    }

    const admin = await prisma.admin.findUnique({ where: { id: decoded.adminId } });
    if (!admin || !admin.isActive) {
      throw new AuthenticationError('Admin not found or deactivated', ERROR_CODES.AUTH.ACCOUNT_DEACTIVATED);
    }

    const { token: newAccessToken, expiresAt: accessExpiresAt } = generateAccessToken({
      adminId: admin.id,
      type: 'ADMIN',
    });

    const { token: newRefreshToken, expiresAt: refreshExpiresAt } = generateRefreshToken({
      adminId: admin.id,
      type: 'ADMIN',
    });

    const meta = _getMeta(req);
    await prisma.adminRefreshToken.create({
      data: {
        token: newRefreshToken,
        adminId: admin.id,
        expiresAt: refreshExpiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    setAccessTokenCookie(res, newAccessToken, accessExpiresAt, true);
    setRefreshTokenCookie(res, newRefreshToken, refreshExpiresAt, true);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies['admin_refresh_token'];
    if (refreshToken) {
      try {
        await prisma.adminRefreshToken.delete({ where: { token: refreshToken } });
      } catch (err) {
        // Ignore if not found
      }
    }

    clearAccessTokenCookie(res, true);
    clearRefreshTokenCookie(res, true);

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user was populated by adminProtect
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  getMe,
};
