const authService = require('../services/auth.service');
const { 
  setRefreshTokenCookie, 
  clearRefreshTokenCookie,
  setAccessTokenCookie,
  clearAccessTokenCookie
} = require('../utils/cookie');
const { AuthenticationError, AppError } = require('../errors/AppError');
const ERROR_CODES = require('../errors/errorCodes');

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
      return next(new AuthenticationError('No refresh token in cookie. Please log in.', ERROR_CODES.AUTH.TOKEN_MISSING));
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

// ─── Email Verification ───────────────────────────────────────────────────────

/**
 * POST /api/auth/send-verification-email
 * Protected (requires login) but does NOT require isEmailVerified.
 */
const sendVerificationEmail = async (req, res, next) => {
  try {
    await authService.sendEmailVerification(req.user);
    res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify-email?token=<rawToken>
 * Public endpoint — called when user clicks the link in the email.
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return next(new AppError('No verification token provided.', 400, ERROR_CODES.AUTH.TOKEN_MISSING));
    }

    await authService.verifyEmail(token);
    res.status(200).json({
      success: true,
      message: 'Email successfully verified. You can now use our services.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Change Password ──────────────────────────────────────────────────────────

/**
 * PATCH /api/auth/change-password
 * Protected + requires verified email.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user, currentPassword, newPassword, _getMeta(req));
    res.status(200).json({
      success: true,
      message: 'Password successfully changed. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot / Reset Password ──────────────────────────────────────────────────

/**
 * POST /api/auth/forgot-password
 * Public — always returns 200 to prevent user enumeration.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    // Always respond with 200 regardless of whether the email exists
    res.status(200).json({
      message: 'If the email exists, you will receive a reset link.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Public — uses the token from the reset email.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword, _getMeta(req));
    res.status(200).json({
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

// ─── OAuth Callbacks ───────────────────────────────────────────────────

/**
 * GET /auth/google/callback (after Passport redirect)
 * req.user is populated by passport.authenticate() before reaching here.
 * Reuses the same cookie helpers as regular login — identical security config.
 */
const googleCallback = async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (!req.user) {
      return res.redirect(`${clientUrl}/login?error=oauth_failed`);
    }

    const meta = _getMeta(req);
    const { accessTokenData, refreshTokenData } = await authService.issueTokens(req.user, meta);

    // Set cookies with IDENTICAL config to regular login
    setAccessTokenCookie(res, accessTokenData.token, accessTokenData.expiresAt);
    setRefreshTokenCookie(res, refreshTokenData.token, refreshTokenData.expiresAt);

    // Redirect to the silent-hydration page on the frontend
    return res.redirect(`${clientUrl}/oauth/callback?status=success`);
  } catch (err) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }
};

/**
 * GET /auth/facebook/callback (after Passport redirect)
 */
const facebookCallback = async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (!req.user) {
      // req.user is false if no email is provided by Facebook
      return res.redirect(`${clientUrl}/login?error=facebook_no_email`);
    }

    const meta = _getMeta(req);
    const { accessTokenData, refreshTokenData } = await authService.issueTokens(req.user, meta);

    // Set cookies with IDENTICAL config to regular login
    setAccessTokenCookie(res, accessTokenData.token, accessTokenData.expiresAt);
    setRefreshTokenCookie(res, refreshTokenData.token, refreshTokenData.expiresAt);

    // Redirect to the silent-hydration page on the frontend
    return res.redirect(`${clientUrl}/oauth/callback?status=success`);
  } catch (err) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  sendVerificationEmail,
  verifyEmail,
  changePassword,
  forgotPassword,
  resetPassword,
  googleCallback,
  facebookCallback,
};
