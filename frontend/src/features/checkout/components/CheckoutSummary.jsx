import { formatVND } from '@/utils/price';
import { VariantOptionBadges } from '@/components/product/VariantOptionBadges';
import { formatCouponRuleDescription } from '@/utils/couponDisplay';

export function CheckoutSummary({ cartItems, totalItems, totalPrice, appliedCoupon }) {
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = Math.max(totalPrice - discountAmount, 0);
  const couponDetail =
    appliedCoupon?.couponMeta?.description ||
    (appliedCoupon?.couponMeta ? formatCouponRuleDescription(appliedCoupon.couponMeta) : '');

  return (
    <div className="bg-[#fbfcff] p-6 lg:p-8 rounded-3xl border border-apple-blue/10 sticky top-24">
      <h2 className="text-xl font-bold text-apple-dark tracking-tight mb-6">Đơn hàng của bạn</h2>

      <div className="flex flex-col gap-5 max-h-[350px] overflow-y-auto mb-6 pr-2 custom-scrollbar border-b border-[#f5f5f7] pb-6">
        {cartItems?.map((item) => {
          const listUnit =
            item.originalUnitPrice != null && item.originalUnitPrice !== ''
              ? Number(item.originalUnitPrice)
              : Number(item.price);
          const displayFinalPrice =
            item.finalPrice != null && item.finalPrice !== ''
              ? Number(item.finalPrice)
              : listUnit;
          const showSale =
            displayFinalPrice < listUnit - 0.5 || (item.discountPercent ?? 0) > 0;
          const savedPerUnit = showSale ? Math.max(0, listUnit - displayFinalPrice) : 0;

          return (
            <div key={item.id} className="flex gap-4">
              <div className="relative shrink-0">
                <img 
                  src={item.image || '/placeholder.png'} 
                  alt={item.name} 
                  className="w-16 h-16 object-cover rounded-xl border border-border"
                />
                <span className="absolute -top-1.5 -right-1.5 bg-muted text-muted-foreground text-sm font-bold min-w-[26px] h-[26px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <h4 className="text-sm font-semibold text-apple-dark line-clamp-2 leading-snug">{item.name}</h4>
                <VariantOptionBadges options={item.variantOptions} className="mt-1.5" />
                {showSale ? (
                  <div className="flex flex-wrap items-baseline gap-1.5 mt-1">
                    <span className="text-sm font-bold text-red-500">{formatVND(displayFinalPrice)}</span>
                    <span className="text-xs line-through text-gray-400">{formatVND(listUnit)}</span>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-primary mt-1">{formatVND(displayFinalPrice)}</p>
                )}
                {showSale && savedPerUnit > 0 && (
                  <span className="text-[11px] text-green-600 font-medium mt-0.5">
                    Tiết kiệm {formatVND(savedPerUnit * item.quantity)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center text-apple-secondary">
          <span>Tạm tính ({totalItems} sản phẩm)</span>
          <span className="font-semibold text-foreground">{formatVND(totalPrice)}</span>
        </div>
        <div className="flex justify-between items-center text-apple-secondary">
          <span>Phí vận chuyển</span>
          <span className="font-semibold text-green-600">Miễn phí</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between items-start gap-2 text-green-600">
            <div className="min-w-0">
              <span className="flex flex-wrap items-center gap-1">
                Giảm giá
                <span className="font-mono text-xs bg-green-100 text-green-700 rounded px-1 py-0.5 font-bold tracking-wider">
                  {appliedCoupon.code}
                </span>
              </span>
              {couponDetail && (
                <p className="text-xs text-green-800/90 font-normal mt-1 leading-snug">{couponDetail}</p>
              )}
            </div>
            <span className="font-semibold shrink-0">
              − {discountAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}

        <div className="pt-4 mt-2 border-t border-[#f5f5f7] flex justify-between items-center">
          <span className="text-base font-bold text-apple-dark">Tổng cộng</span>
          <div className="flex flex-col items-end">
            {appliedCoupon && (
              <span className="text-xs line-through text-gray-400 mb-0.5">{formatVND(totalPrice)}</span>
            )}
            <span className="text-2xl font-black text-primary">{formatVND(finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
