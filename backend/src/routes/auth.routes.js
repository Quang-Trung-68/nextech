const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { protect, requireEmailVerified } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/auth.validation');

// ─── Public routes ────────────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);   // Uses HttpOnly cookie — no Bearer needed
router.post('/logout', authController.logout);     // Public — works even if access token expired

// Email verification (public — token comes from email link)
router.get('/verify-email', authController.verifyEmail);

// Forgot / Reset password (public — anti-enumeration on forgot)
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.get('/me', protect, authController.getMe);

// Send verification email — protect only (unverified users need to request this)
router.post('/send-verification-email', protect, authController.sendVerificationEmail);

// Change password — requires verified email
router.patch(
  '/change-password',
  protect,
  requireEmailVerified,
  validate(changePasswordSchema),
  authController.changePassword
);

// ─── Google OAuth routes (NO protect middleware) ──────────────────────────────
// Initiates the Google consent screen flow
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google redirects back here after user consents
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  authController.googleCallback
);

// ─── Facebook OAuth routes (NO protect middleware) ────────────────────────────
// Initiates the Facebook consent screen flow
router.get(
  '/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

// Facebook redirects back here after user consents
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  authController.facebookCallback
);

module.exports = router;
