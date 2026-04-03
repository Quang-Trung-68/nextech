const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { validate } = require('../middleware/validateRequest');
const { createTagSchema, tagParamsSchema } = require('../validations/post.validation');

// Public
router.get('/', tagController.getAllTags);

// Admin only
router.post(
  '/',
  protect,
  restrictTo('ADMIN'),
  validate(createTagSchema),
  tagController.createTag
);

router.delete(
  '/:id',
  protect,
  restrictTo('ADMIN'),
  validate(tagParamsSchema, 'params'),
  tagController.deleteTag
);

module.exports = router;
