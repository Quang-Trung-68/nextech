const serverConfig = require('../configs/server.config');

const REFRESH_COOKIE_NAME = 'refresh_token';
const ACCESS_COOKIE_NAME = 'access_token';

// In production, frontend (nextech.io.vn) and backend API (api.nextech.io.vn)
// are on different subdomains. Cross-site cookies REQUIRE:
//   sameSite: 'none' + secure: true
// In development (same origin via Vite proxy), 'lax' is safe enough.
const getSameSite = () => (serverConfig.isDev ? 'lax' : 'none');

/**
 * Set the access token as a secure HttpOnly cookie.
 */
const setAccessTokenCookie = (res, token, expiresAt, isAdmin = false) => {
  const cookieName = isAdmin ? `admin_${ACCESS_COOKIE_NAME}` : ACCESS_COOKIE_NAME;
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: serverConfig.nodeEnv === 'production', // HTTPS only in prod
    sameSite: getSameSite(),
    expires: expiresAt,
    path: '/api',
  });
};

/**
 * Clear the access token cookie.
 */
const clearAccessTokenCookie = (res, isAdmin = false) => {
  const cookieName = isAdmin ? `admin_${ACCESS_COOKIE_NAME}` : ACCESS_COOKIE_NAME;
  res.cookie(cookieName, '', {
    httpOnly: true,
    secure: serverConfig.nodeEnv === 'production',
    sameSite: getSameSite(),
    expires: new Date(0),
    path: '/api',
  });
};

/**
 * Set the refresh token as a secure HttpOnly cookie.
 */
const setRefreshTokenCookie = (res, token, expiresAt, isAdmin = false) => {
  const cookieName = isAdmin ? `admin_${REFRESH_COOKIE_NAME}` : REFRESH_COOKIE_NAME;
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: serverConfig.nodeEnv === 'production',
    sameSite: getSameSite(),
    expires: expiresAt,
    path: isAdmin ? '/api/admin/auth' : '/api/auth',
  });
};

/**
 * Clear the refresh token cookie by expiring it immediately.
 */
const clearRefreshTokenCookie = (res, isAdmin = false) => {
  const cookieName = isAdmin ? `admin_${REFRESH_COOKIE_NAME}` : REFRESH_COOKIE_NAME;
  res.cookie(cookieName, '', {
    httpOnly: true,
    secure: serverConfig.nodeEnv === 'production',
    sameSite: getSameSite(),
    expires: new Date(0),
    path: isAdmin ? '/api/admin/auth' : '/api/auth',
  });
};

module.exports = {
  setAccessTokenCookie,
  clearAccessTokenCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
