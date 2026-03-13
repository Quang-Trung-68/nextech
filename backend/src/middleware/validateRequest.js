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
      const flattened = result.error.flatten();
      const errors = { ...flattened.fieldErrors };
      
      if (flattened.formErrors && flattened.formErrors.length > 0) {
        errors._root = flattened.formErrors;
      }

      return next({
        statusCode: 422,
        message: 'Dữ liệu không hợp lệ',
        errors,
      });
    }

    // Gán lại data đã sanitize (coerced, trimmed, stripped extra fields)
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
