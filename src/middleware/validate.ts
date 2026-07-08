const { sendError } = require('../utils/apiResponse');

/**
 * Validates req.body (or a specified part of the request) against a Zod schema.
 * On failure, returns the mandatory { success, message, errorDetails } shape.
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errorDetails = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, {
      statusCode: 400,
      message: 'Validation failed',
      errorDetails,
    });
  }

  req[source] = result.data;
  next();
};

module.exports = validate;

export {};
