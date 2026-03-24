const prisma = require('../utils/prisma');
const { AppError, NotFoundError, ForbiddenError, ConflictError } = require('../errors/AppError');
const recalculateProductRating = require('../utils/recalculateProductRating');

// ─── POST /api/reviews ────────────────────────────────────────────────────────

/**
 * Tạo review mới cho một OrderItem đã giao.
 *
 * Business rules (theo thứ tự):
 * 1. OrderItem phải tồn tại.
 * 2. OrderItem phải thuộc về user đang đăng nhập.
 * 3. Order phải có status DELIVERED.
 * 4. Chưa review OrderItem này (orderItemId @unique enforce at DB level, nhưng check trước để thông báo friendly).
 * 5. Tạo review.
 */
const createReview = async ({ orderItemId, rating, comment, userId }) => {
  // 1 & 2 — tìm OrderItem, include order và product
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: { select: { id: true, userId: true, status: true } },
      product: { select: { id: true, name: true } },
    },
  });

  // 2 — không tồn tại
  if (!orderItem) {
    throw new NotFoundError('OrderItem');
  }

  // 3 — sở hữu
  if (orderItem.order.userId !== userId) {
    throw new ForbiddenError('Bạn không có quyền review sản phẩm này.');
  }

  // 4 — trạng thái đơn
  if (orderItem.order.status !== 'DELIVERED') {
    throw new AppError('Chỉ có thể review sản phẩm từ đơn hàng đã giao.', 400);
  }

  // 5 — duplicate check
  const existing = await prisma.review.findUnique({
    where: { orderItemId },
  });
  if (existing) {
    throw new ConflictError('Bạn đã review sản phẩm này cho đơn hàng đó rồi.');
  }

  // 6 — tạo review
  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      userId,
      productId: orderItem.productId,
      orderItemId,
    },
  });

  // 7 — sync denormalized rating fields trên Product
  await recalculateProductRating(review.productId);

  return review;
};

// ─── GET /api/products/:productId/reviews ────────────────────────────────────

/**
 * Danh sách reviews của 1 sản phẩm, kèm pagination và summary.
 */
const getProductReviews = async ({ productId, page, limit }) => {
  const skip = (page - 1) * limit;

  // Danh sách reviews (phân trang)
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { name: true, avatar: true } },
      },
    }),
    prisma.review.count({ where: { productId } }),
  ]);

  // Summary: aggregate + groupBy — KHÔNG dùng raw SQL
  const [aggregate, groupBy] = await Promise.all([
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true },
    }),
  ]);

  // Build ratingDistribution: { 1: n, 2: n, ..., 5: n }
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of groupBy) {
    ratingDistribution[row.rating] = row._count.rating;
  }

  const averageRating =
    aggregate._avg.rating !== null
      ? Math.round(aggregate._avg.rating * 10) / 10
      : null;

  return {
    reviews,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
    summary: {
      averageRating,
      totalReviews: aggregate._count.rating,
      ratingDistribution,
    },
  };
};

// ─── DELETE /api/reviews/:reviewId ───────────────────────────────────────────

/**
 * Admin xóa bất kỳ review nào (moderation).
 */
const deleteReview = async (reviewId) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { productId: true },
  });

  if (!review) {
    throw new NotFoundError('Review');
  }

  await prisma.review.delete({ where: { id: reviewId } });

  // sync denormalized rating fields trên Product
  await recalculateProductRating(review.productId);
};

module.exports = {
  createReview,
  getProductReviews,
  deleteReview,
};
