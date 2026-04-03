/** Giá trị phải khớp Product.category trong DB (seed dùng tiếng Việt). */
export const SLUG_MAP = {
  phone: 'Điện thoại',
  laptop: 'Laptop',
  tablet: 'Máy tính bảng',
  accessories: 'Phụ kiện',
};

export const PRODUCT_TYPES = ['phone', 'laptop', 'tablet', 'accessories'];

export const SLUG_LABEL_MAP = {
  phone: 'Điện thoại',
  laptop: 'Laptop',
  tablet: 'Máy tính bảng',
  accessories: 'Phụ kiện',
  sale: 'Khuyến mãi',
};

/** pathname segment đầu tiên → category DB */
export const getProductTypeFromPath = (pathname) => {
  const seg = pathname.split('/').filter(Boolean)[0];
  return PRODUCT_TYPES.includes(seg) ? seg : null;
};

export const getSlugByCategory = (category) => {
  return Object.keys(SLUG_MAP).find((key) => SLUG_MAP[key] === category) || 'phone';
};
