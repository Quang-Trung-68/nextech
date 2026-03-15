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
      message: 'Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư.',
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
      const error = new Error('Token xác thực không được cung cấp.');
      error.statusCode = 400;
      return next(error);
    }

    await authService.verifyEmail(token);
    res.status(200).json({
      success: true,
      message: 'Email đã được xác thực thành công. Bạn có thể tiếp tục sử dụng dịch vụ.',
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
    const { newPassword } = req.body;
    await authService.changePassword(req.user, newPassword);
    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được thay đổi thành công. Vui lòng đăng nhập lại.',
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
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
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
    await authService.resetPassword(token, newPassword);
    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập với mật khẩu mới.',
    });
  } catch (error) {
    next(error);
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
};
