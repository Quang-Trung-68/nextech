const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuth.controller');
const { adminProtect } = require('../middleware/adminAuth');
const { authLimiter } = require('../middleware/rateLimiter');

// Admin Auth Routes
router.post('/login', authLimiter, adminAuthController.login);
router.post('/refresh', adminAuthController.refresh);
router.post('/logout', adminAuthController.logout);

// Protected Admin Auth Routes
router.get('/me', adminProtect, adminAuthController.getMe);

module.exports = router;
