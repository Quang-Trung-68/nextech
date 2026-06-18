import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Chuỗi hiển thị VND: chỉ số nguyên (không xu), phân cách hàng nghìn bằng dấu phẩy.
 * Giá từ API/Decimal đôi khi có phần lẻ — làm tròn để không còn ",36" sau dấu phẩy.
 */
export function formatVndDigits(value) {
  if (value === '' || value == null) return '';
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return '';
  return n.toLocaleString('en-US', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

/** Parse input chỉ giữ chữ số → number (hoặc '' nếu rỗng) */
export function parseDigitsToVndNumber(raw) {
  const d = String(raw).replace(/\D/g, '');
  if (d === '') return '';
  return Number(d);
}

/**
 * Ô nhập tiền VND: hiển thị 10,000,000; giá trị gửi form là số nguyên (đồng).
 */
export const VndCurrencyInput = forwardRef(function VndCurrencyInput(
  { value, onChange, onBlur, className, disabled, ...props },
  ref,
) {
  const display = formatVndDigits(
    value === '' || value == null ? '' : Number(value),
  );

  return (
    <Input
      ref={ref}
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      className={cn(className)}
      value={display}
      onChange={(e) => {
        const n = parseDigitsToVndNumber(e.target.value);
        if (n === '') {
          onChange?.('');
          return;
        }
        onChange?.(Math.round(n));
      }}
      onBlur={onBlur}
      {...props}
    />
  );
});
