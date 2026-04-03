class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(errors) {
    super('Dữ liệu không hợp lệ', 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message, code) {
    super(message, 401, code);
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message, code) {
    super(message, 409, code);
  }
}

class PaymentError extends AppError {
  constructor(message, code) {
    super(message, 402, code);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PaymentError
};
