const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect, requireEmailVerified, restrictTo } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const { validate } = require('../middleware/validateRequest');
const {
  createReviewSchema,
  getProductReviewsQuerySchema,
  reviewParamsSchema,
} = require('../validations/review.validation');

// ─── User routes ──────────────────────────────────────────────────────────────

// POST /api/reviews — Gửi review cho một OrderItem đã giao
router.post(
  '/',
  protect,
  requireEmailVerified,
  validate(createReviewSchema),
  reviewController.createReview
);

// ─── Admin routes ─────────────────────────────────────────────────────────────

// DELETE /api/reviews/:reviewId — Admin xóa review (moderation)
router.delete(
  '/:reviewId',
  adminProtect,
  validate(reviewParamsSchema, 'params'),
  reviewController.deleteReview
);

module.exports = router;
