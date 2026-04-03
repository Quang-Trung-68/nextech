/**
 * Sale helper functions.
 */

/**
 * Checks if a product's flash sale is active based on time and stock.
 * @param {object} product - The product from Prisma
 * @returns {boolean} true if sale is active, false otherwise
 */
function isSaleActive(product) {
  // 1. product.salePrice != null
  if (product.salePrice == null) {
    return false;
  }

  // 2. product.saleExpiresAt == null OR product.saleExpiresAt > new Date()
  if (product.saleExpiresAt != null) {
    const expiry = new Date(product.saleExpiresAt);
    if (expiry <= new Date()) {
      return false;
    }
  }

  // 3. product.saleStock == null OR product.saleSoldCount < product.saleStock
  if (product.saleStock != null) {
    if (product.saleSoldCount >= product.saleStock) {
      return false;
    }
  }

  return true;
}

/**
 * Flash sale riêng từng biến thể (cùng quy tắc thời hạn / suất như sản phẩm).
 */
function isVariantSaleActive(variant) {
  if (variant.salePrice == null) {
    return false;
  }

  if (variant.saleExpiresAt != null) {
    const expiry = new Date(variant.saleExpiresAt);
    if (expiry <= new Date()) {
      return false;
    }
  }

  if (variant.saleStock != null) {
    const sold = variant.saleSoldCount ?? 0;
    if (sold >= variant.saleStock) {
      return false;
    }
  }

  return true;
}

module.exports = {
  isSaleActive,
  isVariantSaleActive,
};
