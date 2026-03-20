/**
 * Utility functions for price calculation — frontend version.
 * Prisma Decimal serialize thành string qua JSON API → dùng Number() để xử lý cả string lẫn number.
 */

/**
 * Giá thực khách trả.
 * @param {string|number} price
 * @param {string|number|null|undefined} salePrice
 * @returns {number}
 */
export function getFinalPrice(price, salePrice) {
  const p = Number(price);
  const s = salePrice != null ? Number(salePrice) : null;
  if (s !== null && s > 0 && s < p) return s;
  return p;
}

/**
 * % giảm giá để hiển thị badge.
 * Trả về 0 nếu không giảm.
 * @param {string|number} price
 * @param {string|number|null|undefined} salePrice
 * @returns {number}
 */
export function getDiscountPercent(price, salePrice) {
  const p = Number(price);
  const s = salePrice != null ? Number(salePrice) : null;
  if (s === null || s <= 0 || s >= p) return 0;
  return Math.round((1 - s / p) * 100);
}

/**
 * Tính ngược % giảm từ snapshot OrderItem (không lưu DB).
 * @param {string|number} price       — giá thực trả (= finalPrice snapshot)
 * @param {string|number} originalPrice — giá gốc snapshot
 * @returns {number}
 */
export function getDiscountPercentFromSnapshot(price, originalPrice) {
  const p = Number(price);
  const o = Number(originalPrice);
  if (o <= 0 || p >= o) return 0;
  return Math.round((1 - p / o) * 100);
}

/**
 * Format số tiền sang VNĐ.
 * @param {string|number} amount
 * @returns {string}
 */
export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(amount));
}
