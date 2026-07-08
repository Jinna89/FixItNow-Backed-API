const { sendError, ApiError } = require('../utils/apiResponse');

/** 404 handler for unmatched routes. */
function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Ensures every error response follows the
 * mandatory shape: { success, message, errorDetails }.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Prisma known request errors (e.g. unique constraint violations)
  if (err.code === 'P2002') {
    return sendError(res, {
      statusCode: 409,
      message: `Duplicate value for field: ${err.meta?.target?.join(', ') || 'unknown'}`,
      errorDetails: err.meta || null,
    });
  }
  if (err.code === 'P2025') {
    return sendError(res, {
      statusCode: 404,
      message: 'Requested resource not found',
      errorDetails: err.meta || null,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, {
      statusCode: 401,
      message: 'Invalid or expired token',
      errorDetails: err.message,
    });
  }

  if (err instanceof ApiError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errorDetails: err.errorDetails,
    });
  }

  console.error('Unhandled error:', err);
  return sendError(res, {
    statusCode: err.statusCode || 500,
    message: err.message || 'Internal server error',
    errorDetails: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
}

module.exports = { notFoundHandler, errorHandler };

export {};
