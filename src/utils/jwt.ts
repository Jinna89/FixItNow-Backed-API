const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

/** Converts "7d" / "15m" style strings to a millisecond duration for DB expiry storage. */
function expiresInToDate(expiresIn) {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000); // fallback 7d
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return new Date(now + value * unitMs);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  REFRESH_EXPIRES_IN,
  expiresInToDate,
};

export {};
