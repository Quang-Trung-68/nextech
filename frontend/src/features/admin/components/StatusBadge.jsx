import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }) {
  const STATUS_VI = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Đã giao',
    PAID: 'Đã thanh toán',
    COMPLETED: 'Hoàn thành',
    ACTIVE: 'Hoạt động',
    CANCELLED: 'Đã huỷ',
    FAILED: 'Thất bại',
    BANNED: 'Bị cấm',
    REFUNDED: 'Đã hoàn tiền',
  };

  const statusText = STATUS_VI[status?.toUpperCase()] || status?.toLowerCase();

  const getStatusStyle = (s) => {
    switch (s?.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED':
      case 'PAID':
      case 'COMPLETED':
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
      case 'FAILED':
      case 'BANNED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Badge variant="outline" className={`capitalize font-medium ${getStatusStyle(status)}`}>
      {statusText}
    </Badge>
  );
}

