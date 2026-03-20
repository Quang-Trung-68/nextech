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

  // --- Multer Errors ---
  if (err.name === 'MulterError' || err.code === 'INVALID_FILE_FORMAT' || err.message === 'INVALID_FILE_FORMAT') {
    // Nếu upload đã lên Cloudinary thành công nhưng xảy ra lỗi sau đó, tiến hành rollback
    if (req.cloudinaryFiles && req.cloudinaryFiles.length > 0) {
      const cloudinary = require('../utils/cloudinary');
      Promise.all(req.cloudinaryFiles.map(file => {
        if (file.publicId) return cloudinary.uploader.destroy(file.publicId);
        return null;
      })).catch(console.error);
    }
    
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Kích thước file quá lớn (tối đa 5MB)';
      return res.status(400).json({ success: false, message, errors: { files: [message] } });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Vượt quá số lượng file cho phép hoặc sai tên biến field';
      return res.status(400).json({ success: false, message, errors: { files: [message] } });
    }
    if (err.code === 'INVALID_FILE_FORMAT' || err.message === 'INVALID_FILE_FORMAT') {
      message = 'Định dạng file không hợp lệ (chỉ nhận jpg, png, webp)';
      return res.status(400).json({ success: false, message, errors: { files: [message] } });
    }
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

  // --- Cloudinary Errors ---
  if (err.http_code) {
    statusCode = err.http_code;
    message = err.message || 'Cloudinary Error';
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

