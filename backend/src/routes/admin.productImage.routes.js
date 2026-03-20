const express = require('express');
const router = express.Router({ mergeParams: true });
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../middleware/upload');
const productImageController = require('../controllers/productImage.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { adminProductParamsSchema } = require('../validations/admin.validation');
const { deleteImagesSchema } = require('../validations/productImage.validation');

// Route được bảo vệ (Admin only)
router.use(protect, restrictTo('ADMIN'));

// Mouting at /api/admin/products/:id/images
// Do đó router này sẽ xử lý gốc là `/`

// Upload images
// Sử dụng upload.array('images', 10) để upload tối đa 10 file
router.post(
  '/',
  validate(adminProductParamsSchema, 'params'),
  upload.array('images', 10),
  uploadToCloudinary,
  productImageController.uploadImages
);

// Delete images
router.delete(
  '/',
  validate(adminProductParamsSchema, 'params'),
  validate(deleteImagesSchema), // Validate req.body
  productImageController.deleteImages
);

module.exports = router;
