const reviewService = require('../services/review.service');
const catchAsync = require('../utils/catchAsync');

/**
 * POST /api/reviews
 * Tạo review cho một OrderItem đã giao hàng.
 */
const createReview = catchAsync(async (req, res) => {
  const { orderItemId, rating, comment } = req.body;
  const review = await reviewService.createReview({
    orderItemId,
    rating,
    comment,
    userId: req.user.id,
  });
  res.status(201).json({ success: true, review });
});

/**
 * GET /api/products/:productId/reviews
 * Danh sách reviews công khai của 1 sản phẩm (phân trang + summary).
 */
const getProductReviews = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const { page, limit } = req.query;
  const result = await reviewService.getProductReviews({ productId, page, limit });
  res.status(200).json({ success: true, ...result });
});

/**
 * DELETE /api/reviews/:reviewId
 * Admin xóa review (moderation).
 */
const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(req.params.reviewId);
  res.status(204).send();
});

module.exports = {
  createReview,
  getProductReviews,
  deleteReview,
};
