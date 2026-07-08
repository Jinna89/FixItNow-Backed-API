const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, ApiError } = require('../utils/apiResponse');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  expiresInToDate,
  REFRESH_EXPIRES_IN,
} = require('../utils/jwt');

function toPublicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

async function issueTokens(user) {
  const payload = { sub: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: expiresInToDate(REFRESH_EXPIRES_IN),
    },
  });

  return { accessToken, refreshToken };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, phone, role },
  });

  if (role === 'TECHNICIAN') {
    await prisma.technicianProfile.create({ data: { userId: user.id } });
  }

  const tokens = await issueTokens(user);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Registration successful',
    data: { user: toPublicUser(user), ...tokens },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status === 'BANNED') {
    throw new ApiError(403, 'Your account has been banned. Contact support.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokens = await issueTokens(user);

  return sendSuccess(res, {
    message: 'Login successful',
    data: { user: toPublicUser(user), ...tokens },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token is no longer valid. Please log in again.');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || user.status === 'BANNED') {
    throw new ApiError(401, 'Account unavailable');
  }

  // Rotate refresh token
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const tokens = await issueTokens(user);

  return sendSuccess(res, {
    message: 'Token refreshed',
    data: tokens,
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
  return sendSuccess(res, { message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { technicianProfile: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return sendSuccess(res, { message: 'Current user fetched', data: toPublicUser(user) });
});

module.exports = { register, login, refresh, logout, me };

export {};
