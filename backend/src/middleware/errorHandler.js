const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const { AppError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

module.exports = (err, req, res, next) => {
  // Log the error stack to console (do not expose to client)
  console.error('[Global Error]', err);

  let statusCode = 500;
  let code = ERROR_CODES.SERVER.INTERNAL_SERVER_ERROR;
  let message = 'Đã xảy ra lỗi không mong muốn';
  let errors = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    if (err.errors) errors = err.errors;
  } else if (typeof err?.statusCode === 'number') {
    // Middleware đôi khi ném `new Error()` và gán `err.statusCode/err.code`.
    // Bắt buộc tôn trọng các giá trị này để client nhận đúng status (vd: 401)
    // thay vì luôn trả về 500.
    statusCode = err.statusCode;
    if (err.code) code = err.code;
    message = err.message || message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = ERROR_CODES.SERVER.VALIDATION_ERROR;
    message = 'Dữ liệu không hợp lệ';
    errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError || err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      const fields = err.meta?.target ? err.meta.target.join(', ') : 'unknown';
      message = `Duplicate field value: ${fields}`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = ERROR_CODES.SERVER.NOT_FOUND;
      message = 'Resource not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      code = 'INVALID_REFERENCE';
      message = 'Invalid reference or foreign key constraint failed';
    } else {
      statusCode = 500;
      code = ERROR_CODES.SERVER.INTERNAL_SERVER_ERROR;
      message = 'Database error occurred';
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ERROR_CODES.AUTH.TOKEN_INVALID;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ERROR_CODES.AUTH.TOKEN_EXPIRED;
    message = 'Token expired';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      code = ERROR_CODES.MEDIA.FILE_TOO_LARGE;
      message = 'File size is too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      code = ERROR_CODES.MEDIA.IMAGE_UPLOAD_FAILED;
      message = 'Unexpected file field';
    } else {
      code = ERROR_CODES.MEDIA.IMAGE_UPLOAD_FAILED;
      message = 'File upload error';
    }
  } else if (err.code === 'INVALID_FILE_FORMAT' || err.message === 'INVALID_FILE_FORMAT') {
    statusCode = 400;
    code = ERROR_CODES.MEDIA.INVALID_FILE_TYPE;
    message = 'Invalid file format';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON payload';
  }

  // Rollback uploaded files if error
  if (req.cloudinaryFiles && req.cloudinaryFiles.length > 0) {
    const cloudinary = require('../utils/cloudinary');
    Promise.all(req.cloudinaryFiles.map(file => {
      if (file.publicId) return cloudinary.uploader.destroy(file.publicId);
      return null;
    })).catch(console.error);
  }

  const response = {
    success: false,
    message,
    code
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};
