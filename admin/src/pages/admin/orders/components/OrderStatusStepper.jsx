const STEPS = [
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'PACKING', label: 'Đóng gói' },
  { key: 'SHIPPING', label: 'Vận chuyển' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
];

const STATUS_INDEX = {
  PENDING: 0,
  CONFIRMED: 1,
  PACKING: 2,
  SHIPPING: 3,
  COMPLETED: 4,
  CANCELLED: -1,
  RETURNED: -1,
};

export default function OrderStatusStepper({ status }) {
  const activeIdx = STATUS_INDEX[status] ?? 0;
  const cancelled = status === 'CANCELLED' || status === 'RETURNED';

  if (cancelled) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
        Trạng thái: <strong>{status === 'CANCELLED' ? 'Đã hủy' : 'Hoàn trả'}</strong>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => {
        const done = i < activeIdx;
        const current = i === activeIdx;
        return (
          <div key={s.key} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && (
              <span className={`h-px w-4 sm:w-8 ${done || current ? 'bg-primary' : 'bg-border'}`} />
            )}
            <span
              className={`rounded-full px-2 py-1 text-[10px] sm:text-xs font-medium ${
                current
                  ? 'bg-primary text-primary-foreground'
                  : done
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
