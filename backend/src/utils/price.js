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

const { isSaleActive, isVariantSaleActive } = require('./saleUtils');

/**
 * Thêm computed fields finalPrice và discountPercent vào một product object.
 * @param {object} product
 * @returns {object}
 */
function addPriceFields(product) {
  const saleActive = isSaleActive(product);
  const p = parseFloat(product.price);
  const s = product.salePrice != null ? parseFloat(product.salePrice) : null;

  const effectivePrice = saleActive ? s : p;
  const discountPercent = (saleActive && s != null && s < p && p > 0) ? Math.round((1 - s / p) * 100) : 0;
  
  const saleRemaining = product.saleStock != null
    ? Math.max(0, product.saleStock - product.saleSoldCount)
    : null;

  return { 
    ...product, 
    finalPrice: effectivePrice, 
    discountPercent,
    effectivePrice,
    saleRemaining,
    isSaleActive: saleActive
  };
}

/**
 * Giá thực tế của một biến thể: ưu tiên flash sale riêng biến thể, sau đó flash sale chung (theo tỉ lệ giá gốc).
 * @param {object} product — đã có hasVariants, price, salePrice, …
 * @param {object} variant — bản ghi ProductVariant
 */
function getVariantEffectivePricing(product, variant) {
  const base = parseFloat(variant.price);
  if (Number.isNaN(base)) {
    return {
      finalPrice: 0,
      originalPrice: 0,
      discountPercent: 0,
      isSaleActive: false,
      saleRemaining: null,
      saleExpiresAt: null,
      saleSource: null,
    };
  }

  if (isVariantSaleActive(variant)) {
    const s = parseFloat(variant.salePrice);
    if (s > 0 && s < base) {
      const saleRemaining =
        variant.saleStock != null
          ? Math.max(0, variant.saleStock - (variant.saleSoldCount ?? 0))
          : null;
      return {
        finalPrice: s,
        originalPrice: base,
        discountPercent: Math.round((1 - s / base) * 100),
        isSaleActive: true,
        saleRemaining,
        saleExpiresAt: variant.saleExpiresAt,
        saleSource: 'variant',
      };
    }
  }

  if (product.hasVariants && isSaleActive(product)) {
    const p = parseFloat(product.price);
    const sp = parseFloat(product.salePrice);
    if (!Number.isNaN(p) && !Number.isNaN(sp) && sp > 0 && sp < p) {
      const final = base * (sp / p);
      const saleRemaining =
        product.saleStock != null
          ? Math.max(0, product.saleStock - (product.saleSoldCount ?? 0))
          : null;
      return {
        finalPrice: final,
        originalPrice: base,
        discountPercent: Math.round((1 - final / base) * 100),
        isSaleActive: true,
        saleRemaining,
        saleExpiresAt: product.saleExpiresAt,
        saleSource: 'product',
      };
    }
  }

  return {
    finalPrice: base,
    originalPrice: base,
    discountPercent: 0,
    isSaleActive: false,
    saleRemaining: null,
    saleExpiresAt: null,
    saleSource: null,
  };
}

function enrichVariantForStore(product, variant) {
  const pricing = getVariantEffectivePricing(product, variant);
  return {
    ...variant,
    finalPrice: pricing.finalPrice,
    effectivePrice: pricing.finalPrice,
    originalPrice: pricing.originalPrice,
    discountPercent: pricing.discountPercent,
    isSaleActive: pricing.isSaleActive,
    saleRemaining: pricing.saleRemaining,
    saleExpiresAt: pricing.saleExpiresAt,
    saleSource: pricing.saleSource,
  };
}

module.exports = {
  getFinalPrice,
  getDiscountPercent,
  getDiscountPercentFromSnapshot,
  addPriceFields,
  getVariantEffectivePricing,
  enrichVariantForStore,
};
