const jwt = require('jsonwebtoken');
const authConfig = require('../configs/auth.config');

/**
 * Parse a JWT expires-in string like "1h", "7d" to a Date object.
 * This is used to store the exact expiry time in the database.
 */
const _parseExpiresAt = (expiresIn) => {
  const now = Date.now();
  const units = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  return new Date(now + parseInt(match[1], 10) * units[match[2]]);
};

// ─── Access Token ──────────────────────────────────────────────────────────────

/**
 * Generate a short-lived access token.
 * @param {{ userId: string, role: string }} payload
 * @returns {{ token: string, expiresAt: Date }}
 */
const generateAccessToken = (payload) => {
  const token = jwt.sign(payload, authConfig.accessTokenSecret, {
    expiresIn: authConfig.accessTokenExpiresIn,
  });
  const expiresAt = _parseExpiresAt(authConfig.accessTokenExpiresIn);
  return { token, expiresAt };
};

/**
 * Verify an access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, authConfig.accessTokenSecret);
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────

/**
 * Generate a long-lived refresh token.
 * @param {{ userId: string }} payload
 * @returns {{ token: string, expiresAt: Date }}
 */
const generateRefreshToken = (payload) => {
  const token = jwt.sign(payload, authConfig.refreshTokenSecret, {
    expiresIn: authConfig.refreshTokenExpiresIn,
  });
  const expiresAt = _parseExpiresAt(authConfig.refreshTokenExpiresIn);
  return { token, expiresAt };
};

/**
 * Verify a refresh token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, authConfig.refreshTokenSecret);
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
