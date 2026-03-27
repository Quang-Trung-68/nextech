const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { createCategorySchema, categoryParamsSchema } = require('../validations/post.validation');

// Public
router.get('/', categoryController.getAllCategories);

// Admin only
router.post(
  '/',
  protect,
  restrictTo('ADMIN'),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.delete(
  '/:id',
  protect,
  restrictTo('ADMIN'),
  validate(categoryParamsSchema, 'params'),
  categoryController.deleteCategory
);

module.exports = router;
