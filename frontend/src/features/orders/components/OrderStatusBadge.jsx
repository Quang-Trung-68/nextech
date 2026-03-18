import { Badge } from '@/components/ui/badge';
import { Clock, Loader2, Truck, CheckCircle, XCircle } from 'lucide-react';

export function OrderStatusBadge({ status }) {
  const statusConfig = {
    PENDING: {
      label: 'Chờ xử lý',
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none px-3 py-1',
      icon: Clock,
    },
    PROCESSING: {
      label: 'Đang xử lý',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 py-1',
      icon: Loader2,
    },
    SHIPPED: {
      label: 'Đang giao',
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-none px-3 py-1',
      icon: Truck,
    },
    DELIVERED: {
      label: 'Đã giao',
      className: 'bg-green-100 text-green-700 hover:bg-green-200 border-none px-3 py-1',
      icon: CheckCircle,
    },
    CANCELLED: {
      label: 'Đã huỷ',
      className: 'bg-red-100 text-red-700 hover:bg-red-200 border-none px-3 py-1',
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
