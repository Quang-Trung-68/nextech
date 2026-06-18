const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const { validate } = require('../middleware/validateRequest');
const {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
} = require('../validations/post.validation');

// Public
router.get('/', categoryController.getAllCategories);

// Admin only
router.post(
  '/',
  adminProtect,
  validate(createCategorySchema),
  categoryController.createCategory
);

router.patch(
  '/:id',
  adminProtect,
  validate(categoryParamsSchema, 'params'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  '/:id',
  adminProtect,
  validate(categoryParamsSchema, 'params'),
  categoryController.deleteCategory
);

module.exports = router;
