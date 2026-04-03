import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { validateCoupon } from '@/api/coupon.api';
import { Tag, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatCouponRuleDescription } from '@/utils/couponDisplay';

/**
 * CouponInput — standalone coupon widget cho Checkout.
 *
 * Props:
 *   orderAmount   {number}  — tổng tiền hiện tại để validate phía server
 *   onApply       {fn}      — callback({ code, discountAmount, couponId, couponMeta }) khi apply thành công
 *   onRemove      {fn}      — callback() khi user hủy mã
 *   appliedCoupon {object|null} — { code, discountAmount, couponId, couponMeta? } | null
 */
export function CouponInput({ orderAmount, onApply, onRemove, appliedCoupon }) {
  const [inputValue, setInputValue] = useState('');
  const [couponError, setCouponError] = useState(null);

  const { mutate: apply, isPending } = useMutation({
    mutationFn: () => validateCoupon({ code: inputValue.trim(), orderAmount }),
    onSuccess: (data) => {
      setCouponError(null);
      const meta = data.couponMeta;
      onApply({
        code: inputValue.trim().toUpperCase(),
        discountAmount: data.discountAmount,
        couponId: data.couponId,
        couponMeta: meta
          ? {
              ...meta,
              description: meta.description || formatCouponRuleDescription(meta),
            }
          : undefined,
      });
    },
    onError: (err) => {
      setCouponError(err.response?.data?.message || 'Mã giảm giá không hợp lệ.');
    },
  });

  const handleRemove = () => {
    setInputValue('');
    setCouponError(null);
    onRemove();
  };

  // Đã apply thành công → hiển thị badge trạng thái
  if (appliedCoupon) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl px-5 py-4 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-green-800">
              Áp dụng thành công — mã{' '}
              <span className="font-mono tracking-wider bg-green-200/50 px-2 py-0.5 rounded-md text-green-900">{appliedCoupon.code}</span>
            </p>
            <p className="text-sm font-medium text-green-700 mt-1">
              Giảm ngay{' '}
              <span className="font-extrabold text-green-800 text-base">
                {appliedCoupon.discountAmount.toLocaleString('vi-VN')}đ
              </span>
              {appliedCoupon.couponMeta?.description && (
                <span className="block text-xs text-green-800/90 font-normal mt-1.5 leading-snug">
                  {appliedCoupon.couponMeta.description}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-auto flex-shrink-0 p-1.5 rounded-full hover:bg-green-200/50 text-green-600 hover:text-green-800 transition-colors"
            aria-label="Hủy mã giảm giá"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            id="coupon-code-input"
            type="text"
            placeholder="Nhập mã giảm giá"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value.toUpperCase());
              if (couponError) setCouponError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (inputValue.trim()) apply();
              }
            }}
            disabled={isPending}
            className={cn(
              'h-12 text-base md:text-sm pl-9 font-mono tracking-widest',
              couponError && 'border-red-400 focus-visible:ring-red-300'
            )}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => apply()}
          disabled={isPending || !inputValue.trim()}
          className="flex-shrink-0 min-w-[88px] h-12"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Áp dụng'
          )}
        </Button>
      </div>

      {couponError && (
        <p className="text-xs text-red-500 pl-1">{couponError}</p>
      )}
    </div>
  );
}
