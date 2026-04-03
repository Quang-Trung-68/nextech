import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Loader2,
  Truck,
  CheckCircle,
  XCircle,
  Package,
  ShieldCheck,
  Undo2,
} from 'lucide-react';

export function OrderStatusBadge({ status }) {
  const statusConfig = {
    PENDING: {
      label: 'Chờ xác nhận',
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none px-3 py-1',
      icon: Clock,
    },
    CONFIRMED: {
      label: 'Đã xác nhận',
      className: 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-none px-3 py-1',
      icon: ShieldCheck,
    },
    PACKING: {
      label: 'Đang đóng gói',
      className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none px-3 py-1',
      icon: Package,
    },
    SHIPPING: {
      label: 'Đang vận chuyển',
      className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-none px-3 py-1',
      icon: Truck,
    },
    COMPLETED: {
      label: 'Hoàn thành',
      className: 'bg-green-100 text-green-700 hover:bg-green-200 border-none px-3 py-1',
      icon: CheckCircle,
    },
    CANCELLED: {
      label: 'Đã huỷ',
      className: 'bg-red-100 text-red-700 hover:bg-red-200 border-none px-3 py-1',
      icon: XCircle,
    },
    RETURNED: {
      label: 'Đã hoàn trả',
      className: 'bg-violet-100 text-violet-800 hover:bg-violet-200 border-none px-3 py-1',
      icon: Undo2,
    },
    // Legacy (DB cũ / cache)
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
