/**
 * SKU: [CATEGORY_CODE]-[PRODUCT_ID_SHORT]-[VARIANT_INDEX]
 * CATEGORY_CODE từ map 4 danh mục; fallback chuẩn hóa tên.
 */

const CATEGORY_CODE_MAP = {
  'Điện thoại': 'DT',
  Laptop: 'LT',
  'Máy tính bảng': 'MTB',
  'Phụ kiện': 'PK',
};

/**
 * @param {string} category - Product.category (tiếng Việt hoặc Latin)
 * @returns {string} mã 2–4 ký tự
 */
function getCategoryCode(category) {
  if (!category || typeof category !== 'string') return 'PRD';
  const trimmed = category.trim();
  if (CATEGORY_CODE_MAP[trimmed]) return CATEGORY_CODE_MAP[trimmed];
  const normalized = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
  const code = normalized.slice(0, 4).toUpperCase();
  return code.length >= 2 ? code : 'PRD';
}

/**
 * @param {string} categoryCode - từ getCategoryCode(product.category)
 * @param {string} productId - cuid
 * @param {number} index - 1-based variant index
 */
function generateSku(categoryCode, productId, index) {
  const short = String(productId).slice(0, 5);
  const suffix = String(index).padStart(3, '0');
  return `${categoryCode}-${short}-${suffix}`;
}

module.exports = {
  CATEGORY_CODE_MAP,
  getCategoryCode,
  generateSku,
};
