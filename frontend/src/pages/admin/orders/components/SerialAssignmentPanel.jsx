import { useState, useMemo } from 'react';
import { useAvailableSerialsForOrder, useAssignSerials } from '@/features/admin/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Loader2 } from 'lucide-react';

export default function SerialAssignmentPanel({ orderId, onDone }) {
  const { data, isLoading, refetch } = useAvailableSerialsForOrder(orderId);
  const { mutate: assign, isPending } = useAssignSerials();

  const items = data?.items ?? [];
  const [selection, setSelection] = useState({});

  const ready = useMemo(() => {
    if (!items.length) return false;
    return items.every((row) => selection[row.orderItemId]);
  }, [items, selection]);

  const handleAssign = () => {
    const assignments = items.map((row) => ({
      orderItemId: row.orderItemId,
      serialUnitId: selection[row.orderItemId],
    }));
    assign(
      { id: orderId, assignments },
      {
        onSuccess: () => {
          toast.success('Đã gán serial — đơn chuyển sang Đóng gói');
          setSelection({});
          onDone?.();
        },
        onError: (e) => toast.error(e.response?.data?.message || 'Không gán được serial'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải serial khả dụng…
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
      <p className="text-sm font-semibold">Gán IMEI / Serial (bắt buộc mỗi dòng SL = 1)</p>
      {items.map((row) => (
        <div key={row.orderItemId} className="flex flex-col sm:flex-row sm:items-start gap-2">
          <div className="text-xs text-muted-foreground shrink-0 w-full sm:w-56 space-y-0.5">
            <p className="font-medium text-foreground">{row.productName ?? 'Sản phẩm'}</p>
            {row.variantSku ? (
              <p className="text-[11px] font-mono text-muted-foreground">SKU: {row.variantSku}</p>
            ) : null}
          </div>
          <select
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            value={selection[row.orderItemId] || ''}
            onChange={(e) =>
              setSelection((s) => ({ ...s, [row.orderItemId]: e.target.value }))
            }
          >
            <option value="">— Chọn serial —</option>
            {row.availableSerials?.map((su) => (
              <option key={su.id} value={su.id}>
                {su.serial}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => refetch()} variant="outline" type="button">
          Làm mới
        </Button>
        <Button size="sm" disabled={!ready || isPending} onClick={handleAssign}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Xác nhận gán &amp; chuyển Đóng gói
        </Button>
      </div>
    </div>
  );
}
