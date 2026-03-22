const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { shopSettingsSchema } = require('../validations/settings.validation');

router.use(protect, restrictTo('ADMIN'));

// GET /api/admin/settings
router.get('/', settingsController.getSettings);

// PATCH /api/admin/settings
router.patch(
  '/',
  validate(shopSettingsSchema, 'body'),
  settingsController.updateSettings
);

module.exports = router;
