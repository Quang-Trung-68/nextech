const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

/**
 * Protect routes — validates the access token from the Authorization header.
 *
 * On TOKEN_EXPIRED the response includes `code: 'TOKEN_EXPIRED'` so the
 * frontend knows to silently call POST /api/auth/refresh instead of
 * redirecting the user to the login page.
 */
const protect = async (req, res, next) => {
  try {
    let token = req.cookies['access_token'];

    // Fallback cho Authorization header nếu có gửi kèm (tương thích cũ hoặc external API)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      const error = new Error('No token provided. Please log in to get access.');
      error.statusCode = 401;
      return next(error);
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired. Please refresh.',
          code: 'TOKEN_EXPIRED',
        });
      }
      const error = new Error('Invalid token. Please log in again.');
      error.statusCode = 401;
      return next(error);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      const error = new Error('The user belonging to this token no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    if (!user.isActive) {
      const error = new Error('Account is deactivated. Please contact support.');
      error.statusCode = 401;
      return next(error);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: require email to be verified.
 * Must be used AFTER `protect`.
 * Routes that call this will return 403 if the user's email is not verified.
 * Use for sensitive actions (change password, checkout, etc.).
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Vui lòng xác thực email trước khi tiếp tục.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

/**
 * Restrict access to specific roles.
 * Must be used AFTER `protect`.
 * @param {...string} roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error('You do not have permission to perform this action.');
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};

module.exports = { protect, restrictTo, requireEmailVerified };
