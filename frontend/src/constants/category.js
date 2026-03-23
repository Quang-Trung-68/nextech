export const SLUG_MAP = {
  'iphone': 'smartphone',
  'mac': 'laptop',
  'ipad': 'tablet',
  'accessories': 'accessory',
};

export const SLUG_LABEL_MAP = {
  'iphone': 'Điện thoại',
  'mac': 'Laptop',
  'ipad': 'Máy tính bảng',
  'accessories': 'Phụ kiện',
};

export const getSlugByCategory = (category) => {
  return Object.keys(SLUG_MAP).find((key) => SLUG_MAP[key] === category) || 'all';
};
