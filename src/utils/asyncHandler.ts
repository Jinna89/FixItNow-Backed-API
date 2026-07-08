/**
 * Wraps an async route handler and forwards any thrown error to
 * Express's error-handling middleware via next().
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

export {};
