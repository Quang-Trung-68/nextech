const serverConfig = require('../configs/server.config');

/**
 * Centralized error handler middleware
 */
module.exports = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // --- Zod Validation Errors (422) ---
  // Phải đặt TRƯỚC generic handler để trả về fieldErrors dạng object
  if (statusCode === 422 && err.errors) {
    return res.status(422).json({
      success: false,
      message: err.message,
      errors: err.errors, // object { field: [messages] }
      ...(serverConfig.nodeEnv === 'development' && { stack: err.stack }),
    });
  }

  // --- Prisma Errors ---
  if (err.name === 'PrismaClientKnownRequestError') {
    // Unique constraint failed (e.g. duplicate email)
    if (err.code === 'P2002') {
      statusCode = 400;
      message = 'Duplicate field value entered';
    } else {
      statusCode = 400;
      message = `Database error: ${err.message}`;
    }
  } else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data input for the database';
  }

  // --- JWT Errors ---
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again!';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired! Please log in again.';
  }

  // --- express-validator context errors (legacy) ---
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    message = 'Validation Error';
    const errorMessages = err.array().map((e) => e.msg);
    return res.status(statusCode).json({
      success: false,
      message,
      errors: errorMessages,
    });
  }

  // Final catch-all response format
  res.status(statusCode).json({
    success: false,
    message,
    ...(serverConfig.nodeEnv === 'development' && { stack: err.stack }), // Stack trace for dev
  });
};

