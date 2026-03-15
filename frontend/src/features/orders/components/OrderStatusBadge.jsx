import { Badge } from '../../../components/ui/badge';
import { Clock, Loader2, Truck, CheckCircle, XCircle } from 'lucide-react';

export function OrderStatusBadge({ status }) {
  const statusConfig = {
    PENDING: {
      label: 'Chờ xác nhận',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-3 py-1',
      icon: Clock,
    },
    PROCESSING: {
      label: 'Đang xử lý',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 py-1',
      icon: Loader2,
    },
    SHIPPED: {
      label: 'Đang giao hàng',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-3 py-1',
      icon: Truck,
    },
    DELIVERED: {
      label: 'Đã giao thành công',
      className: 'bg-green-100 text-green-700 hover:bg-green-200 border-none px-3 py-1',
      icon: CheckCircle,
    },
    CANCELLED: {
      label: 'Đã huỷ',
      className: 'bg-red-100 text-red-700 hover:bg-red-200 border-none px-3 py-1 line-through',
      icon: XCircle,
    },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <Badge className={`font-semibold text-[13px] flex items-center gap-1.5 w-max ${config.className}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'PROCESSING' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}
