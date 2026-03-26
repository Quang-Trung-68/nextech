import { useEffect, useState, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { AddressSelector } from '@/components/shared/AddressSelector';

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
    'flex h-12 w-full rounded-md border bg-white px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground',
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
  const shippingAddress = watch('shippingAddress');

  const [localType, setLocalType] = useState('INDIVIDUAL');

  const lastAutoFillNameRef = useRef('');
  const lastAutoFillAddressRef = useRef('');

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

  useEffect(() => {
    if (isVatRequested && localType === 'INDIVIDUAL') {
      const fullAddrParts = [
        shippingAddress?.addressLine,
        shippingAddress?.ward,
        shippingAddress?.city
      ].filter(p => p && p.trim() !== '');
      const fullAddr = fullAddrParts.join(', ');
      const newName = shippingAddress?.fullName || '';

      const currentName = getValues('vatBuyerName');
      const currentAddress = getValues('vatBuyerAddress');

      if (!currentName || currentName === lastAutoFillNameRef.current) {
        setValue('vatBuyerName', newName, { shouldValidate: false });
        lastAutoFillNameRef.current = newName;
      }
      if (!currentAddress || currentAddress === lastAutoFillAddressRef.current) {
        setValue('vatBuyerAddress', fullAddr, { shouldValidate: false });
        lastAutoFillAddressRef.current = fullAddr;
      }
    }
  }, [shippingAddress?.fullName, shippingAddress?.addressLine, shippingAddress?.ward, shippingAddress?.city, isVatRequested, localType, setValue, getValues]);

  const companyLine = watch('vatBuyerCompanyAddressLine');
  const companyWard = watch('vatBuyerCompanyWard');
  const companyCity = watch('vatBuyerCompanyCity');

  useEffect(() => {
    if (localType === 'COMPANY') {
      const parts = [companyLine, companyWard, companyCity].filter(p => p && p.trim() !== '');
      setValue('vatBuyerCompanyAddress', parts.join(', '), { shouldValidate: parts.length > 0 });
    }
  }, [companyLine, companyWard, companyCity, localType, setValue]);

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

  const handleTypeChange = (type) => {
    setLocalType(type);
    setValue('vatBuyerType', type, { shouldValidate: true });

    if (type === 'INDIVIDUAL') {
      setValue('vatBuyerCompany',        undefined, { shouldValidate: false });
      setValue('vatBuyerTaxCode',        undefined, { shouldValidate: false });
      setValue('vatBuyerCompanyAddress', undefined, { shouldValidate: false });
      setValue('vatBuyerCompanyCity', undefined, { shouldValidate: false });
      setValue('vatBuyerCompanyWard', undefined, { shouldValidate: false });
      setValue('vatBuyerCompanyAddressLine', undefined, { shouldValidate: false });
      setValue('vatBuyerEmail',          undefined, { shouldValidate: false });
    } else {
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
            <div className="flex gap-4 mb-4">
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

              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-foreground">Địa chỉ công ty <span className="text-destructive">*</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AddressSelector
                    cityValue={watch('vatBuyerCompanyCity') || ''}
                    onCityChange={(val) => setValue('vatBuyerCompanyCity', val, { shouldValidate: false })}
                    cityError={!watch('vatBuyerCompanyCity') && errors.vatBuyerCompanyAddress ? 'Thiếu Tỉnh/Thành' : undefined}
                    wardValue={watch('vatBuyerCompanyWard') || ''}
                    onWardChange={(val) => setValue('vatBuyerCompanyWard', val, { shouldValidate: false })}
                    wardError={!watch('vatBuyerCompanyWard') && errors.vatBuyerCompanyAddress ? 'Thiếu Xã/Phường' : undefined}
                  />
                </div>
                <FormField label="Tên đường/số nhà" required error={errors.vatBuyerCompanyAddressLine && !watch('vatBuyerCompanyAddressLine') ? { message: 'Vui lòng nhập Tên đường/số nhà' } : undefined}>
                  <input
                    type="text"
                    {...register('vatBuyerCompanyAddressLine')}
                    className={inputClass(!!errors.vatBuyerCompanyAddress && !watch('vatBuyerCompanyAddressLine'))}
                    placeholder="123 Lê Lợi"
                  />
                </FormField>
                <input type="hidden" {...register('vatBuyerCompanyAddress')} />
                {errors.vatBuyerCompanyAddress && !watch('vatBuyerCompanyAddress') && (
                  <p className="text-xs text-destructive font-medium mt-0.5">{errors.vatBuyerCompanyAddress.message}</p>
                )}
              </div>

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
