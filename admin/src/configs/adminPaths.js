/**
 * Client-side routes for the standalone admin app (no /admin URL prefix).
 * API calls still use /admin/... via axios — do not use these for API paths.
 */
export const adminPaths = {
  overview: '/overview',
  products: '/products',
  productEdit: (id) => `/products/${id}/edit`,
  orders: '/orders',
  orderDetail: (orderId) => `/orders?orderId=${orderId}`,
  inventorySuppliers: '/inventory/suppliers',
  inventoryStockImports: '/inventory/stock-imports',
  inventorySerials: '/inventory/serials',
  inventorySerialsLow: '/inventory/serials?tab=low',
  users: '/users',
  coupons: '/coupons',
  news: '/news',
  newsCategories: '/news/categories',
  newsCreate: '/news/create',
  newsEdit: (id) => `/news/${id}/edit`,
  banners: '/banners',
  brands: '/brands',
  settings: '/settings',
};

export function getNotificationActionUrl(notification) {
  const { type, data } = notification;
  switch (type) {
    case 'order_status_changed':
    case 'payment_result':
    case 'new_order':
      return data?.orderId ? adminPaths.orderDetail(data.orderId) : adminPaths.orders;
    case 'low_stock':
      return data?.productId ? adminPaths.productEdit(data.productId) : adminPaths.products;
    default:
      return adminPaths.overview;
  }
}

export function isNewsSection(pathname) {
  return (
    pathname === adminPaths.news ||
    pathname.startsWith(`${adminPaths.news}/create`) ||
    /^\/news\/[^/]+\/edit$/.test(pathname)
  );
}

export function isNewsCategoriesSection(pathname) {
  return pathname.startsWith(adminPaths.newsCategories);
}
