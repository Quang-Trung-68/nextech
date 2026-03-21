import axiosInstance from '@/lib/axios';

/**
 * POST /api/coupons/validate
 * User validate mã coupon trước khi checkout.
 * @param {{ code: string, orderAmount: number }} params
 */
export const validateCoupon = async ({ code, orderAmount }) => {
  const { data } = await axiosInstance.post('/coupons/validate', { code, orderAmount });
  return data;
};

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * POST /api/coupons
 * Admin tạo mã giảm giá mới.
 */
export const adminCreateCoupon = async (couponData) => {
  const { data } = await axiosInstance.post('/coupons', couponData);
  return data;
};

/**
 * GET /api/coupons
 * Admin lấy danh sách tất cả mã giảm giá.
 */
export const adminListCoupons = async () => {
  const { data } = await axiosInstance.get('/coupons');
  return data;
};

/**
 * DELETE /api/coupons/:id
 * Admin xóa mã giảm giá.
 */
export const adminDeleteCoupon = async (id) => {
  const { data } = await axiosInstance.delete(`/coupons/${id}`);
  return data;
};

/**
 * PATCH /api/coupons/:id/toggle
 * Admin bật/tắt trạng thái active của mã giảm giá.
 */
export const adminToggleCoupon = async (id) => {
  const { data } = await axiosInstance.patch(`/coupons/${id}/toggle`);
  return data;
};
