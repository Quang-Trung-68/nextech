const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, requireEmailVerified } = require('../middleware/auth');
const avatarUpload = require('../middleware/avatarUpload');
const { validate } = require('../middleware/validateRequest');
const {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressParamsSchema,
} = require('../validations/user.validation');

// All user routes require authentication + email verification
router.use(protect, requireEmailVerified);

// ─── Profile ──────────────────────────────────────────────────────────────────
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);
router.post('/me/avatar', avatarUpload.single('avatar'), userController.uploadAvatar);

// ─── Addresses ────────────────────────────────────────────────────────────────
router.get('/me/addresses', userController.getAddresses);
router.post('/me/addresses', validate(createAddressSchema), userController.createAddress);
router.patch('/me/addresses/:id', validate(addressParamsSchema, 'params'), validate(updateAddressSchema), userController.updateAddress);
router.delete('/me/addresses/:id', validate(addressParamsSchema, 'params'), userController.deleteAddress);
router.patch('/me/addresses/:id/default', validate(addressParamsSchema, 'params'), userController.setDefaultAddress);

module.exports = router;
