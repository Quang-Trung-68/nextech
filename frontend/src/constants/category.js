/** Giá trị phải khớp Product.category trong DB (seed dùng tiếng Việt). */
export const SLUG_MAP = {
  iphone: 'Điện thoại',
  mac: 'Laptop',
  ipad: 'Máy tính bảng',
  accessories: 'Phụ kiện',
};

export const SLUG_LABEL_MAP = {
  'iphone': 'Điện thoại',
  'mac': 'Laptop',
  'ipad': 'Máy tính bảng',
  'accessories': 'Phụ kiện',
  'sale': 'Khuyến mãi',
};

export const getSlugByCategory = (category) => {
  return Object.keys(SLUG_MAP).find((key) => SLUG_MAP[key] === category) || 'all';
};
