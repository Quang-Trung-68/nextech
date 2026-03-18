import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }) {
  const getVariant = (s) => {
    switch (s?.toUpperCase()) {
      case 'PAID':
      case 'DELIVERED':
      case 'COMPLETED':
      case 'ACTIVE':
      case 'ADMIN':
        return 'success';
      case 'PENDING':
      case 'PROCESSING':
      case 'USER':
        return 'warning';
      case 'CANCELLED':
      case 'FAILED':
      case 'BANNED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return <Badge variant={getVariant(status)}>{status}</Badge>;
}
