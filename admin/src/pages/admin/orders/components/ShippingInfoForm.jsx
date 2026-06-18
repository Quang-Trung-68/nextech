import { useState } from 'react';
import { useUpdateOrderStatus } from '@/features/admin/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';

const CARRIERS = ['Giao Hàng Nhanh', 'J&T Express', 'GHTK', 'VNPost', 'Ninja Van', 'Khác'];

export default function ShippingInfoForm({ orderId, onDone }) {
  const [carrierName, setCarrierName] = useState(CARRIERS[0]);
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const { mutate, isPending } = useUpdateOrderStatus();

  const submit = () => {
    mutate(
      {
        id: orderId,
        status: 'SHIPPING',
        carrierName,
        trackingCode,
        trackingUrl: trackingUrl || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Đã chuyển sang vận chuyển');
          onDone?.();
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Lỗi cập nhật'),
      }
    );
  };

  return (
    <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
      <p className="text-sm font-semibold">Thông tin giao hàng</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">
          Đơn vị vận chuyển
          <select
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
          >
            {CARRIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          Mã vận đơn
          <Input
            className="mt-1"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            placeholder="VD: GHN123456"
          />
        </label>
      </div>
      <label className="text-xs text-muted-foreground block">
        Link tra cứu (tuỳ chọn)
        <Input
          className="mt-1"
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="https://..."
        />
      </label>
      <Button size="sm" disabled={isPending || !trackingCode.trim()} onClick={submit}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Xác nhận chuyển vận chuyển
      </Button>
    </div>
  );
}
