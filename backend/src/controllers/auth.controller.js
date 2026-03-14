const authService = require('../services/auth.service');
const { 
  setRefreshTokenCookie, 
  clearRefreshTokenCookie,
  setAccessTokenCookie,
  clearAccessTokenCookie
} = require('../utils/cookie');

/** Helper to extract metadata from the request */
const _getMeta = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, accessTokenData, refreshTokenData } = await authService.register(
      name,
      email,
      password,
      _getMeta(req)
    );

    setAccessTokenCookie(res, accessTokenData.token, accessTokenData.expiresAt);
    setRefreshTokenCookie(res, refreshTokenData.token, refreshTokenData.expiresAt);

    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessTokenData, refreshTokenData } = await authService.login(
      email,
      password,
      _getMeta(req)
    );

    setAccessTokenCookie(res, accessTokenData.token, accessTokenData.expiresAt);
    setRefreshTokenCookie(res, refreshTokenData.token, refreshTokenData.expiresAt);

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      const error = new Error('No refresh token in cookie. Please log in.');
      error.statusCode = 401;
      return next(error);
    }

    const { accessTokenData, refreshTokenData } = await authService.refresh(
      refreshToken,
      _getMeta(req)
    );

    // Set the NEW rotated refresh token cookie and access token cookie
    setAccessTokenCookie(res, accessTokenData.token, accessTokenData.expiresAt);
    setRefreshTokenCookie(res, refreshTokenData.token, refreshTokenData.expiresAt);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies['refresh_token'];

    // userId may come from access token (if still valid via protect)
    // or we decode it manually from the refresh token — logout should always succeed
    let userId = req.user?.id;
    if (!userId && refreshToken) {
      try {
        const { verifyRefreshToken } = require('../utils/jwt');
        const decoded = verifyRefreshToken(refreshToken);
        userId = decoded.userId;
      } catch {
        // Expired or invalid refresh token — we still clear the cookie
      }
    }

    const { message } = await authService.logout(refreshToken, userId);

    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is already fully populated by protect middleware — no extra DB query needed
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, getMe };
