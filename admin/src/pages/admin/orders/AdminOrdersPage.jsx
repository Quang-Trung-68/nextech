import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdminOrders } from '@/features/admin/hooks/useAdmin';
import { DataTable } from '@/features/admin/components/DataTable';
import { CustomPagination } from '@/features/admin/components/CustomPagination';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy } from 'lucide-react';
import OrderDetailModal from './components/OrderDetailModal';

const PAYMENT_FILTER_LABEL = {
  all: 'Thanh toán (tất cả)',
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
};

const ORDER_STATUS_FILTER_LABEL = {
  all: 'Trạng thái (tất cả)',
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PACKING: 'Đang đóng gói',
  SHIPPING: 'Đang vận chuyển',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã hoàn trả',
};

const AdminOrdersPage = () => {
  usePageTitle('Đơn hàng | Quản trị');

  const [filterState, setFilterState] = useState({ page: 1, limit: 10, paymentStatus: '', status: '' });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // States for Order Detail Modal
  const [searchParams, setSearchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId');

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highlightOrderId, setHighlightOrderId] = useState(null);

  useEffect(() => {
    let clearTimer;
    const onNewOrder = (e) => {
      const oid = e.detail?.orderId;
      if (!oid) return;
      setHighlightOrderId(oid);
      setFilterState((prev) => ({ ...prev, page: 1 }));
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => setHighlightOrderId(null), 45_000);
    };
    window.addEventListener('admin:new-order', onNewOrder);
    return () => {
      window.removeEventListener('admin:new-order', onNewOrder);
      clearTimeout(clearTimer);
    };
  }, []);

  useEffect(() => {
    if (queryOrderId) {
      queueMicrotask(() => {
        setSelectedOrderId(queryOrderId);
        setIsModalOpen(true);
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('orderId');
      setSearchParams(newParams, { replace: true });
    }
  }, [queryOrderId, searchParams, setSearchParams]);

  const params = useMemo(
    () => ({ ...filterState, search: debouncedSearch }),
    [debouncedSearch, filterState]
  );

  useEffect(() => {
    queueMicrotask(() => setFilterState((prev) => ({ ...prev, page: 1 })));
  }, [debouncedSearch]);

  const { data, isLoading } = useAdminOrders(params);

  const handleRowClick = (order) => {
    setSelectedOrderId(order.id);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Don't reset selectedOrderId immediately to keep it visible during close animation
  };

  const columns = [
    {
      accessorKey: 'id',
      header: 'Mã đơn',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <span className="text-xs font-mono">#{row.original.id.slice(-8).toUpperCase()}</span>
          <button
            type="button"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Copy ID"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(row.original.id.toUpperCase());
              toast.success('Đã copy mã: ' + row.original.id.toUpperCase());
            }}
          >
            <Copy size={14} />
          </button>
        </div>
      ),
    },
    {
      accessorKey: 'user.name',
      header: 'Khách hàng',
      cell: ({ row }) => (
        <span>
          {row.original.user?.name || 'Guest'}
          <br />
          <span className="text-xs text-muted-foreground">{row.original.user?.email || ''}</span>
        </span>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Tổng tiền',
      cell: ({ row }) => formatCurrency(row.original.totalAmount),
    },
    {
      accessorKey: 'paymentMethod',
      header: () => (
        <Select
          value={params.paymentStatus || 'all'}
          onValueChange={(value) => setFilterState((prev) => ({ ...prev, paymentStatus: value !== 'all' ? value : '', page: 1 }))}
        >
          <SelectTrigger className="w-[180px] text-sm bg-transparent border-none shadow-none font-medium p-0 -ml-1 focus:ring-0 focus-visible:ring-0" onClick={e => e.stopPropagation()}>
            <SelectValue placeholder="Thanh toán (tất cả)">
              {(v) => PAYMENT_FILTER_LABEL[v || 'all'] ?? PAYMENT_FILTER_LABEL.all}
            </SelectValue>
          </SelectTrigger>
          <SelectContent onClick={e => e.stopPropagation()}>
            <SelectItem value="all">Thanh toán (tất cả)</SelectItem>
            <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
            <SelectItem value="PAID">Đã thanh toán</SelectItem>
            <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
          </SelectContent>
        </Select>
      ),
      cell: ({ row }) => {
        const m = row.original.paymentMethod;
        const map = { COD: 'Thanh toán khi nhận (COD)', STRIPE: 'Thẻ (Stripe)', SEPAY: 'Chuyển khoản (SePay)' };
        return <span>{map[m] ?? m}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: () => (
        <Select
          value={params.status || 'all'}
          onValueChange={(value) => setFilterState((prev) => ({ ...prev, status: value !== 'all' ? value : '', page: 1 }))}
        >
          <SelectTrigger className="w-[160px] text-sm bg-transparent border-none shadow-none font-medium p-0 -ml-1 focus:ring-0 focus-visible:ring-0" onClick={e => e.stopPropagation()}>
            <SelectValue placeholder="Trạng thái (tất cả)">
              {(v) => ORDER_STATUS_FILTER_LABEL[v || 'all'] ?? ORDER_STATUS_FILTER_LABEL.all}
            </SelectValue>
          </SelectTrigger>
            <SelectContent onClick={e => e.stopPropagation()}>
            <SelectItem value="all">Trạng thái (tất cả)</SelectItem>
            <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
            <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
            <SelectItem value="PACKING">Đang đóng gói</SelectItem>
            <SelectItem value="SHIPPING">Đang vận chuyển</SelectItem>
            <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            <SelectItem value="RETURNED">Đã hoàn trả</SelectItem>
          </SelectContent>
        </Select>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: () => (
        <span className="text-xs text-muted-foreground" onClick={(e) => e.stopPropagation()}>
          Mở chi tiết để xử lý
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
      </div>

      <div className="py-2">
        <input
          type="text"
          placeholder="Tìm theo mã đơn, tên hoặc email..."
          className="border rounded-md px-3 py-2 w-full max-w-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.orders || []}
          onRowClick={handleRowClick}
          rowClassName={(row) =>
            highlightOrderId && row.id === highlightOrderId
              ? 'ring-2 ring-primary/50 bg-primary/5 animate-in fade-in duration-300'
              : ''
          }
        />
      )}

      {data?.pagination?.totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <CustomPagination
            currentPage={params.page}
            totalPages={data.pagination.totalPages}
            onPageChange={(page) => setFilterState(prev => ({ ...prev, page }))}
          />
        </div>
      )}

      <OrderDetailModal
        orderId={selectedOrderId}
        open={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default AdminOrdersPage;
