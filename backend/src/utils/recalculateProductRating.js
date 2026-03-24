const prisma = require('./prisma');

/**
 * Tính lại rating trung bình và numReviews cho một sản phẩm
 * dựa trên toàn bộ reviews hiện có trong DB, rồi cập nhật lại Product.
 *
 * ⚠️  Side-effect only — không throw, không return.
 *     Nếu lỗi, chỉ log để không ảnh hưởng response chính.
 *
 * @param {string} productId
 */
async function recalculateProductRating(productId) {
  try {
    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = Math.round((result._avg.rating ?? 0) * 100) / 100;
    const numReviews = result._count.id;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: averageRating, numReviews },
    });
  } catch (error) {
    console.error('recalculateProductRating error:', error);
  }
}

module.exports = recalculateProductRating;
