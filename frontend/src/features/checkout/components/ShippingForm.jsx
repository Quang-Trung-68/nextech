import { Input } from '@/components/ui/input';

export function ShippingForm({ register, errors }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border space-y-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground mb-4 text-apple-secondary">Xác nhận hoặc chỉnh sửa thông tin</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Họ tên người nhận <span className="text-destructive">*</span></label>
          <Input 
            {...register('shippingAddress.fullName')} 
            placeholder="Ví dụ: Nguyễn Văn A"
            className={errors.shippingAddress?.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.shippingAddress?.fullName && (
            <p className="text-xs text-destructive mt-1">{errors.shippingAddress.fullName.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Số điện thoại <span className="text-destructive">*</span></label>
          <Input 
            type="tel"
            {...register('shippingAddress.phone')} 
            placeholder="Ví dụ: 0912345678"
            className={errors.shippingAddress?.phone ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.shippingAddress?.phone && (
            <p className="text-xs text-destructive mt-1">{errors.shippingAddress.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">Tên đường/phố <span className="text-destructive">*</span></label>
        <Input 
          {...register('shippingAddress.addressLine')} 
          placeholder="Ví dụ: 123 Lê Lợi"
          className={errors.shippingAddress?.addressLine ? "border-destructive focus-visible:ring-destructive" : ""}
        />
        {errors.shippingAddress?.addressLine && (
          <p className="text-xs text-destructive mt-1">{errors.shippingAddress.addressLine.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ward */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Tên xã/phường <span className="text-destructive">*</span></label>
          <Input 
            {...register('shippingAddress.ward')} 
            placeholder="Ví dụ: Phường 4"
            className={errors.shippingAddress?.ward ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.shippingAddress?.ward && (
            <p className="text-xs text-destructive mt-1">{errors.shippingAddress.ward.message}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Tên tỉnh/thành phố <span className="text-destructive">*</span></label>
          <Input 
            {...register('shippingAddress.city')} 
            placeholder="Ví dụ: TP. Hồ Chí Minh"
            className={errors.shippingAddress?.city ? "border-destructive focus-visible:ring-destructive" : ""}
          />
          {errors.shippingAddress?.city && (
            <p className="text-xs text-destructive mt-1">{errors.shippingAddress.city.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
