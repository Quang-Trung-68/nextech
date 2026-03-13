const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);   // Uses HttpOnly cookie — no Bearer needed
router.post('/logout', authController.logout);     // Public — works even if access token expired

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router;
