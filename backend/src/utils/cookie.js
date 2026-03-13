const serverConfig = require('../configs/server.config');

const COOKIE_NAME = 'refresh_token';

/**
 * Set the refresh token as a secure HttpOnly cookie.
 * @param {import('express').Response} res
 * @param {string} token
 * @param {Date} expiresAt
 */
const setRefreshTokenCookie = (res, token, expiresAt) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,                                      // JS client cannot read
    secure: serverConfig.nodeEnv === 'production',            // HTTPS only in prod
    sameSite: 'strict',                                  // CSRF protection
    expires: expiresAt,                                  // Exact expiry time
    path: '/api/auth',                                   // Only sent on /api/auth routes
  });
};

/**
 * Clear the refresh token cookie by expiring it immediately.
 * @param {import('express').Response} res
 */
const clearRefreshTokenCookie = (res) => {
  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: serverConfig.nodeEnv === 'production',
    sameSite: 'strict',
    expires: new Date(0),  // Epoch — forces browser to delete the cookie
    path: '/api/auth',
  });
};

module.exports = {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
