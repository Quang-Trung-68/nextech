const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

/**
 * Protect admin routes — validates the access token from the Authorization header or cookie.
 */
const adminProtect = async (req, res, next) => {
  try {
    let token = req.cookies['admin_access_token'];

    // Fallback cho Authorization header
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

    // Must be admin token type if we add it, but currently payload just has userId. Wait, we should use adminId.
    if (payload.type !== 'ADMIN') {
      const error = new Error('Invalid token type. Admin access required.');
      error.statusCode = 403;
      return next(error);
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      const error = new Error('The admin belonging to this token no longer exists.');
      error.statusCode = 401;
      return next(error);
    }

    if (!admin.isActive) {
      const error = new Error('Account is deactivated. Please contact support.');
      error.statusCode = 401;
      return next(error);
    }

    // Assign to req.user for compatibility with existing admin controllers if they expect req.user
    // But better to use req.admin or just req.user but with a 'ADMIN' role assigned.
    // We will assign req.user with role = 'ADMIN' to not break existing controllers.
    req.user = {
      ...admin,
      role: 'ADMIN',
    };
    req.admin = admin;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { adminProtect };
