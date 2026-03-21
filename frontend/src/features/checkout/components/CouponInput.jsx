import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { validateCoupon } from '@/api/coupon.api';
import { Tag, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * CouponInput — standalone coupon widget cho Checkout.
 *
 * Props:
 *   orderAmount   {number}  — tổng tiền hiện tại để validate phía server
 *   onApply       {fn}      — callback({ code, discountAmount, couponId }) khi apply thành công
 *   onRemove      {fn}      — callback() khi user hủy mã
 *   appliedCoupon {object|null} — { code, discountAmount, couponId } | null
 */
export function CouponInput({ orderAmount, onApply, onRemove, appliedCoupon }) {
  const [inputValue, setInputValue] = useState('');
  const [couponError, setCouponError] = useState(null);

  const { mutate: apply, isPending } = useMutation({
    mutationFn: () => validateCoupon({ code: inputValue.trim(), orderAmount }),
    onSuccess: (data) => {
      setCouponError(null);
      onApply({
        code: inputValue.trim().toUpperCase(),
        discountAmount: data.discountAmount,
        couponId: data.couponId,
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
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-700">
              Áp dụng thành công — mã{' '}
              <span className="font-mono tracking-wider">{appliedCoupon.code}</span>
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Giảm{' '}
              <span className="font-bold">
                {appliedCoupon.discountAmount.toLocaleString('vi-VN')}đ
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-auto flex-shrink-0 text-green-500 hover:text-green-700 transition"
            aria-label="Hủy mã giảm giá"
          >
            <X size={16} />
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
              'pl-9 font-mono tracking-widest',
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
          className="flex-shrink-0 min-w-[88px]"
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
