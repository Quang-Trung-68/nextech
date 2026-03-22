import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

/**
 * Field helper — hiển thị label + input + error message
 */
const FormField = ({ label, required, error, children }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-destructive font-medium mt-0.5">{error.message}</p>
    )}
  </div>
);

const inputClass = (hasError) =>
  cn(
    'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-apple-blue transition-shadow',
    hasError ? 'border-destructive focus:ring-destructive' : 'border-input'
  );

/**
 * VatInvoiceForm
 * Props: register, watch, errors, setValue, getValues
 *
 * Flow:
 *   [ ] Xuất hóa đơn VAT
 *         ↓ (khi tick)
 *     ● Cá nhân    ○ Công ty
 *         ↓
 *   [INDIVIDUAL]                       [COMPANY]
 *   Họ tên (pre-fill shipping)         Tên người đại diện *
 *   Địa chỉ (pre-fill shipping)        Tên công ty *
 *                                      Mã số thuế *
 *                                      Địa chỉ công ty *
 *                                      Email công ty *
 */
export const VatInvoiceForm = ({ register, watch, errors, setValue, getValues }) => {
  const isVatRequested = watch('vatInvoiceRequested');
  const vatBuyerType   = watch('vatBuyerType');

  // Local state để điều khiển loại người mua (INDIVIDUAL / COMPANY)
  // Sync với RHF's vatBuyerType
  const [localType, setLocalType] = useState('INDIVIDUAL');

  // Khi bật VAT: đặt vatBuyerType = INDIVIDUAL và pre-fill từ shipping
  useEffect(() => {
    if (isVatRequested) {
      if (!vatBuyerType) {
        setValue('vatBuyerType', 'INDIVIDUAL', { shouldValidate: false });
        setLocalType('INDIVIDUAL');
      } else {
        setLocalType(vatBuyerType);
      }
    }
  }, [isVatRequested]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill cá nhân từ shippingAddress khi chuyển sang INDIVIDUAL
  useEffect(() => {
    if (isVatRequested && localType === 'INDIVIDUAL') {
      const shipping = getValues('shippingAddress');
      // Chỉ pre-fill nếu field còn trống để không đè lên giá trị user đã sửa
      const currentName    = getValues('vatBuyerName');
      const currentAddress = getValues('vatBuyerAddress');
      if (!currentName)    setValue('vatBuyerName',    shipping?.fullName    ?? '', { shouldValidate: false });
      if (!currentAddress) setValue('vatBuyerAddress', shipping?.addressLine ?? '', { shouldValidate: false });
    }
  }, [localType, isVatRequested]); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi tắt VAT: reset toàn bộ VAT fields
  useEffect(() => {
    if (!isVatRequested) {
      setValue('vatBuyerType',           undefined, { shouldValidate: false });
      setValue('vatBuyerName',           undefined, { shouldValidate: false });
      setValue('vatBuyerAddress',        undefined, { shouldValidate: false });
      setValue('vatBuyerEmail',          undefined, { shouldValidate: false });
      setValue('vatBuyerCompany',        undefined, { shouldValidate: false });
      setValue('vatBuyerTaxCode',        undefined, { shouldValidate: false });
      setValue('vatBuyerCompanyAddress', undefined, { shouldValidate: false });
      setLocalType('INDIVIDUAL');
    }
  }, [isVatRequested, setValue]);

  // Xử lý khi user chọn loại người mua
  const handleTypeChange = (type) => {
    setLocalType(type);
    setValue('vatBuyerType', type, { shouldValidate: true });

    if (type === 'INDIVIDUAL') {
      // Pre-fill từ shipping khi quay lại INDIVIDUAL
      const shipping = getValues('shippingAddress');
      setValue('vatBuyerName',    shipping?.fullName    ?? '', { shouldValidate: false });
      setValue('vatBuyerAddress', shipping?.addressLine ?? '', { shouldValidate: false });
      // Clear company fields
      setValue('vatBuyerCompany',        undefined, { shouldValidate: false });
      setValue('vatBuyerTaxCode',        undefined, { shouldValidate: false });
      setValue('vatBuyerCompanyAddress', undefined, { shouldValidate: false });
      setValue('vatBuyerEmail',          undefined, { shouldValidate: false });
    } else {
      // Clear individual fields khi chuyển sang COMPANY
      setValue('vatBuyerName',    undefined, { shouldValidate: false });
      setValue('vatBuyerAddress', undefined, { shouldValidate: false });
    }
  };

  return (
    <div className="bg-white p-4 md:p-6 rounded-2xl border border-border">
      {/* ─── Toggle xuất hóa đơn ─────────────────────────────────────── */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="vatInvoiceRequested"
          checked={!!isVatRequested}
          onCheckedChange={(checked) => {
            setValue('vatInvoiceRequested', !!checked, { shouldValidate: true });
          }}
          className="mt-0.5"
        />
        <div>
          <label
            htmlFor="vatInvoiceRequested"
            className="text-sm md:text-base font-bold tracking-tight text-foreground cursor-pointer select-none"
          >
            Yêu cầu xuất hóa đơn VAT cho đơn hàng này
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Thông tin hóa đơn sẽ được xuất theo yêu cầu của bạn
          </p>
        </div>
      </div>

      {/* ─── Nội dung khi bật VAT ────────────────────────────────────── */}
      {isVatRequested && (
        <div className="mt-5 pt-5 border-t border-border space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">

          {/* ── Chọn loại người mua ───────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Loại người mua</p>
            <div className="flex gap-4">
              {/* Cá nhân */}
              <label
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium select-none',
                  localType === 'INDIVIDUAL'
                    ? 'border-apple-blue bg-apple-blue/5 text-apple-blue'
                    : 'border-border text-muted-foreground hover:border-apple-blue/40'
                )}
              >
                <input
                  type="radio"
                  className="accent-apple-blue"
                  checked={localType === 'INDIVIDUAL'}
                  onChange={() => handleTypeChange('INDIVIDUAL')}
                  id="vat-individual"
                />
                <span>Cá nhân</span>
              </label>

              {/* Công ty */}
              <label
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium select-none',
                  localType === 'COMPANY'
                    ? 'border-apple-blue bg-apple-blue/5 text-apple-blue'
                    : 'border-border text-muted-foreground hover:border-apple-blue/40'
                )}
              >
                <input
                  type="radio"
                  className="accent-apple-blue"
                  checked={localType === 'COMPANY'}
                  onChange={() => handleTypeChange('COMPANY')}
                  id="vat-company"
                />
                <span>Công ty</span>
              </label>
            </div>
          </div>

          {/* ── Form Cá nhân ─────────────────────────────────────────── */}
          {localType === 'INDIVIDUAL' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <FormField label="Họ tên (trên hóa đơn)" error={errors.vatBuyerName}>
                <input
                  type="text"
                  {...register('vatBuyerName')}
                  className={inputClass(!!errors.vatBuyerName)}
                  placeholder="Nguyễn Văn A"
                />
              </FormField>

              <FormField label="Địa chỉ (trên hóa đơn)" error={errors.vatBuyerAddress}>
                <input
                  type="text"
                  {...register('vatBuyerAddress')}
                  className={inputClass(!!errors.vatBuyerAddress)}
                  placeholder="123 Lê Lợi, Quận 1, TP.HCM"
                />
              </FormField>

              <p className="text-xs text-muted-foreground">
                💡 Thông tin được tự động điền từ địa chỉ giao hàng của bạn. Bạn có thể chỉnh sửa nếu muốn khác.
              </p>
            </div>
          )}

          {/* ── Form Công ty ─────────────────────────────────────────── */}
          {localType === 'COMPANY' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <FormField label="Tên người đại diện" required error={errors.vatBuyerName}>
                <input
                  type="text"
                  {...register('vatBuyerName')}
                  className={inputClass(!!errors.vatBuyerName)}
                  placeholder="Nguyễn Văn A"
                />
              </FormField>

              <FormField label="Tên công ty" required error={errors.vatBuyerCompany}>
                <input
                  type="text"
                  {...register('vatBuyerCompany')}
                  className={inputClass(!!errors.vatBuyerCompany)}
                  placeholder="Công ty TNHH ABC"
                />
              </FormField>

              <FormField label="Mã số thuế" required error={errors.vatBuyerTaxCode}>
                <input
                  type="text"
                  {...register('vatBuyerTaxCode')}
                  className={inputClass(!!errors.vatBuyerTaxCode)}
                  placeholder="0123456789"
                  maxLength={13}
                />
              </FormField>

              <FormField label="Địa chỉ công ty" required error={errors.vatBuyerCompanyAddress}>
                <input
                  type="text"
                  {...register('vatBuyerCompanyAddress')}
                  className={inputClass(!!errors.vatBuyerCompanyAddress)}
                  placeholder="123 Lê Lợi, Quận 1, TP.HCM"
                />
              </FormField>

              <FormField label="Email công ty (nhận hóa đơn)" required error={errors.vatBuyerEmail}>
                <input
                  type="email"
                  {...register('vatBuyerEmail')}
                  className={inputClass(!!errors.vatBuyerEmail)}
                  placeholder="ketoan@company.vn"
                />
              </FormField>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
