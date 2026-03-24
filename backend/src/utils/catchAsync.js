/**
 * Wraps an async Express handler so that any rejected promise
 * is automatically forwarded to next(err), eliminating try/catch boilerplate.
 *
 * @param {Function} fn - Async route handler (req, res, next) => Promise
 * @returns {Function} Express middleware
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
