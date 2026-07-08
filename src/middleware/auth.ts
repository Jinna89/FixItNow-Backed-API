const { verifyAccessToken } = require('../utils/jwt');
const { ApiError } = require('../utils/apiResponse');
const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

/** Verifies the JWT access token and attaches the current user to req.user. */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required. No token provided.');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

  if (!user) {
    throw new ApiError(401, 'User belonging to this token no longer exists.');
  }
  if (user.status === 'BANNED') {
    throw new ApiError(403, 'Your account has been banned. Contact support.');
  }

  req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
  next();
});

/** Restricts access to the given roles. Use after `authenticate`. */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, `Access denied. Required role(s): ${roles.join(', ')}`);
  }
  next();
};

module.exports = { authenticate, authorize };

export {};
