/**
 * Mô tả quy tắc mã giảm giá (đồng bộ với backend formatCouponRuleDescription).
 * @param {{ type: string, value: number, maxDiscountAmount?: number | null } | null | undefined} coupon
 */
export function formatCouponRuleDescription(coupon) {
  if (!coupon) return '';
  if (coupon.type === 'PERCENTAGE') {
    let s = `Giảm ${Number(coupon.value)}% trên tổng giá trị đơn`;
    if (coupon.maxDiscountAmount != null) {
      s += ` (tối đa ${Number(coupon.maxDiscountAmount).toLocaleString('vi-VN')}đ)`;
    }
    return s;
  }
  return `Giảm ${Number(coupon.value).toLocaleString('vi-VN')}đ (cố định)`;
}
