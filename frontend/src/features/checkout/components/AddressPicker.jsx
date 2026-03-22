import { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useAddresses } from '@/features/profile/hooks/useAddresses';
import { useCreateAddress } from '@/features/profile/hooks/useAddressMutations';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddressSelector } from '@/components/shared/AddressSelector';

const vnPhoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;

const newAddressSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  phone: z.string().regex(vnPhoneRegex, 'Số điện thoại không hợp lệ (10 số, bắt đầu 0).'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự.'),
  ward: z.string().min(2, 'Xã/Phường phải có ít nhất 2 ký tự.'),
  city: z.string().min(2, 'Thành phố phải có ít nhất 2 ký tự.'),
});

const NEW_ADDRESS_VALUE = '__new__';

/**
 * AddressPicker
 * Renders a styled dropdown to select a saved address or add a new one.
 * When an existing address is selected, calls onSelect with the address fields.
 * When a new address is saved, also calls onSelect so CheckoutPage can fill the form.
 */
export function AddressPicker({ onSelect, currentUser }) {
  const { data: addresses, isLoading } = useAddresses();
  const { mutateAsync: createAddressAsync, isPending: isSaving } = useCreateAddress();

  const [selected, setSelected] = useState(null); // address id or NEW_ADDRESS_VALUE
  const [isOpen, setIsOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(newAddressSchema),
    defaultValues: {
      fullName: currentUser?.name || '',
      phone: currentUser?.phone || '',
      address: '',
      ward: '',
      city: '',
    },
  });

  // Auto-select default address once addresses are loaded (use ref to avoid cascading-render lint rule)
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current && addresses && addresses.length > 0) {
      initializedRef.current = true;
      const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
      // Use a microtask to defer state updates outside the synchronous effect body
      Promise.resolve().then(() => {
        setSelected(defaultAddr.id);
        onSelect({
          fullName: defaultAddr.fullName,
          phone: defaultAddr.phone,
          addressLine: defaultAddr.address,
          ward: defaultAddr.ward || '',
          city: defaultAddr.city,
        });
      });
    }
  }, [addresses, onSelect]);

  const handleSelect = (addr) => {
    if (addr === NEW_ADDRESS_VALUE) {
      setSelected(NEW_ADDRESS_VALUE);
      setShowNewForm(true);
    } else {
      setSelected(addr.id);
      setShowNewForm(false);
      onSelect({
        fullName: addr.fullName,
        phone: addr.phone,
        addressLine: addr.address,
        ward: addr.ward || '',
        city: addr.city,
      });
    }
    setIsOpen(false);
  };

  const onSaveNew = async (values) => {
    try {
      const res = await createAddressAsync({ ...values, isDefault: false });
      const savedAddr = res?.address;
      if (!savedAddr) throw new Error('Không nhận được dữ liệu địa chỉ.');

      toast.success('Đã lưu địa chỉ mới.');

      const selectedData = {
        fullName: savedAddr.fullName,
        phone: savedAddr.phone,
        addressLine: savedAddr.address,
        ward: savedAddr.ward || '',
        city: savedAddr.city,
      };

      // Update state
      setSelected(savedAddr.id);
      setShowNewForm(false);
      reset();

      // Fill the checkout shipping form (call after state updates settle)
      onSelect(selectedData);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Không thể lưu địa chỉ.');
    }
  };

  const selectedAddr = addresses?.find((a) => a.id === selected);
  const triggerLabel =
    selected === NEW_ADDRESS_VALUE
      ? 'Thêm địa chỉ mới'
      : selectedAddr
      ? `${selectedAddr.fullName} — ${selectedAddr.address}, ${selectedAddr.ward ? selectedAddr.ward + ', ' : ''}${selectedAddr.city}`
      : isLoading
      ? 'Đang tải địa chỉ...'
      : 'Chọn địa chỉ giao hàng';

  return (
    <div className="space-y-3">
      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-[#d2d2d7] rounded-xl text-sm font-medium text-apple-dark hover:border-apple-blue transition-colors shadow-sm"
        >
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-apple-blue shrink-0" />
            <span className="truncate">{triggerLabel}</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-apple-secondary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown list */}
        {isOpen && (
          <div className="absolute z-30 left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#d2d2d7] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-apple-secondary">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải...
              </div>
            ) : (
              <>
                {addresses?.length === 0 && (
                  <p className="text-sm text-apple-secondary text-center py-4 px-4">
                    Bạn chưa có địa chỉ nào được lưu.
                  </p>
                )}
                {addresses?.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelect(addr)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-apple-gray transition-colors border-b border-[#f5f5f7] last:border-0 ${
                      selected === addr.id ? 'bg-apple-blue/5' : ''
                    }`}
                  >
                    <Check
                      className={`w-4 h-4 mt-0.5 shrink-0 transition-opacity ${
                        selected === addr.id ? 'text-apple-blue opacity-100' : 'opacity-0'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-apple-dark">
                        {addr.fullName}
                        {addr.isDefault && (
                          <span className="ml-2 text-[11px] font-bold text-apple-blue bg-apple-blue/10 px-2 py-0.5 rounded-full">
                            Mặc định
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-apple-secondary mt-0.5 truncate">
                        {addr.phone} · {addr.address}{addr.ward ? `, ${addr.ward}` : ''}, {addr.city}
                      </p>
                    </div>
                  </button>
                ))}

                {/* Add new option */}
                <button
                  type="button"
                  onClick={() => handleSelect(NEW_ADDRESS_VALUE)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 text-apple-blue hover:bg-apple-blue/5 transition-colors font-semibold text-sm"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  Thêm địa chỉ mới...
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Inline new address form */}
      {showNewForm && (
        <div className="bg-[#f7f7f9] border border-[#e5e5ea] rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-semibold text-apple-dark flex items-center gap-2">
            <Plus className="w-4 h-4 text-apple-blue" />
            Địa chỉ mới
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-apple-secondary">Họ tên người nhận *</label>
              <Input
                {...register('fullName')}
                placeholder="Nguyễn Văn A"
                className={`bg-white text-sm ${errors.fullName ? 'border-destructive' : ''}`}
              />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-apple-secondary">Số điện thoại *</label>
              <Input
                {...register('phone')}
                placeholder="0912345678"
                className={`bg-white text-sm ${errors.phone ? 'border-destructive' : ''}`}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Controller
              control={control}
              name="city"
              render={({ field: cityField, fieldState: cityState }) => (
                <Controller
                  control={control}
                  name="ward"
                  render={({ field: wardField, fieldState: wardState }) => (
                    <AddressSelector
                      cityValue={cityField.value}
                      onCityChange={cityField.onChange}
                      cityError={cityState.error?.message}
                      wardValue={wardField.value}
                      onWardChange={wardField.onChange}
                      wardError={wardState.error?.message}
                    />
                  )}
                />
              )}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-apple-secondary">Địa chỉ (số nhà, tên đường) *</label>
            <Input
              {...register('address')}
              placeholder="123 Đường Lê Lợi"
              className={`bg-white text-sm ${errors.address ? 'border-destructive' : ''}`}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              onClick={handleSubmit(onSaveNew)}
              disabled={isSaving}
              className="h-9 rounded-full px-5 font-semibold bg-apple-blue hover:bg-apple-blue/90 text-white text-sm"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Lưu và dùng địa chỉ này
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false);
                setSelected(null);
              }}
              className="text-sm text-apple-secondary hover:text-apple-dark transition-colors"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
