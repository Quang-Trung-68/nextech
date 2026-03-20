/**
 * Utility functions for price calculation — dùng chung cho mọi service.
 * Prisma Decimal serialize thành string qua JSON API → luôn parseFloat trước khi tính.
 */

/**
 * Giá thực khách trả.
 * price và salePrice là string (Prisma Decimal) hoặc number.
 * @param {string|number} price
 * @param {string|number|null|undefined} salePrice
 * @returns {number}
 */
function getFinalPrice(price, salePrice) {
  const p = parseFloat(price);
  const s = salePrice != null ? parseFloat(salePrice) : null;
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
function getDiscountPercent(price, salePrice) {
  const p = parseFloat(price);
  const s = salePrice != null ? parseFloat(salePrice) : null;
  if (s === null || s <= 0 || s >= p) return 0;
  return Math.round((1 - s / p) * 100);
}

/**
 * Tính ngược % giảm từ snapshot OrderItem (không lưu DB).
 * @param {string|number} price       — giá thực trả (= finalPrice snapshot)
 * @param {string|number} originalPrice — giá gốc snapshot
 * @returns {number}
 */
function getDiscountPercentFromSnapshot(price, originalPrice) {
  const p = parseFloat(price);
  const o = parseFloat(originalPrice);
  if (o <= 0 || p >= o) return 0;
  return Math.round((1 - p / o) * 100);
}

/**
 * Thêm computed fields finalPrice và discountPercent vào một product object.
 * @param {object} product
 * @returns {object}
 */
function addPriceFields(product) {
  const finalPrice = getFinalPrice(product.price, product.salePrice);
  const discountPercent = getDiscountPercent(product.price, product.salePrice);
  return { ...product, finalPrice, discountPercent };
}

module.exports = {
  getFinalPrice,
  getDiscountPercent,
  getDiscountPercentFromSnapshot,
  addPriceFields,
};
