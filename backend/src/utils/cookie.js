const serverConfig = require('../configs/server.config');

const REFRESH_COOKIE_NAME = 'refresh_token';
const ACCESS_COOKIE_NAME = 'access_token';

/**
 * Set the access token as a secure HttpOnly cookie.
 * @param {import('express').Response} res
 * @param {string} token
 * @param {Date} expiresAt
 */
const setAccessTokenCookie = (res, token, expiresAt) => {
  res.cookie(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: serverConfig.nodeEnv === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/api', // Gửi kèm access token cho tất cả API bắt đầu bằng /api
  });
};

/**
 * Clear the access token cookie.
 * @param {import('express').Response} res
 */
const clearAccessTokenCookie = (res) => {
  res.cookie(ACCESS_COOKIE_NAME, '', {
    httpOnly: true,
    secure: serverConfig.nodeEnv === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    path: '/api',
  });
};

/**
 * Set the refresh token as a secure HttpOnly cookie.
 * @param {import('express').Response} res
 * @param {string} token
 * @param {Date} expiresAt
 */
const setRefreshTokenCookie = (res, token, expiresAt) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
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
  res.cookie(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: serverConfig.nodeEnv === 'production',
    sameSite: 'strict',
    expires: new Date(0),  // Epoch — forces browser to delete the cookie
    path: '/api/auth',
  });
};

module.exports = {
  setAccessTokenCookie,
  clearAccessTokenCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
