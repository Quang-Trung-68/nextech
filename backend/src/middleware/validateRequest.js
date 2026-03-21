const { ValidationError } = require('../errors/AppError');

/**
 * Factory function tạo Express middleware từ Zod schema.
 *
 * @param {import('zod').ZodTypeAny} schema - Zod schema để validate
 * @param {'body' | 'query' | 'params'} source - Phần của req cần validate
 * @returns {import('express').RequestHandler}
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const mappedErrors = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return next(new ValidationError(mappedErrors));
    }

    // Gán lại data đã sanitize (coerced, trimmed, stripped extra fields)
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
