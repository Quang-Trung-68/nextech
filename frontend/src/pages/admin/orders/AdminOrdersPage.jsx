import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import { useDebounce } from '@/hooks/useDebounce';
import { useAdminOrders, useUpdateOrderStatus } from '@/features/admin/hooks/useAdmin';
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

const AdminOrdersPage = () => {
  usePageTitle('Manage Orders | Admin');

  const [filterState, setFilterState] = useState({ page: 1, limit: 10, paymentStatus: '', status: '' });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // States for Order Detail Modal
  const [searchParams, setSearchParams] = useSearchParams();
  const queryOrderId = searchParams.get('orderId');

  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (queryOrderId) {
      setSelectedOrderId(queryOrderId);
      setIsModalOpen(true);
      
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
    setFilterState(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  const { data, isLoading } = useAdminOrders(params);
  const { mutate: updateOrderStatus, isPending: isUpdating } = useUpdateOrderStatus();

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(
      { id: orderId, status: newStatus },
      {
        onSuccess: () => toast.success('Email notification sent to customer'),
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
      }
    );
  };

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
      header: 'Order ID',
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
      header: 'Customer',
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
      header: 'Total',
      cell: ({ row }) => formatCurrency(row.original.totalAmount),
    },
    {
      accessorKey: 'paymentMethod',
      header: () => (
        <Select
          value={params.paymentStatus || 'all'}
          onValueChange={(value) => setFilterState((prev) => ({ ...prev, paymentStatus: value !== 'all' ? value : '', page: 1 }))}
        >
          <SelectTrigger className="w-[130px] text-sm capitalize bg-transparent border-none shadow-none font-medium p-0 -ml-1 focus:ring-0 focus-visible:ring-0" onClick={e => e.stopPropagation()}>
            <SelectValue placeholder="Thanh toán (tất cả)" />
          </SelectTrigger>
          <SelectContent onClick={e => e.stopPropagation()}>
            <SelectItem value="all">Thanh toán (tất cả)</SelectItem>
            <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
            <SelectItem value="PAID">Đã thanh toán</SelectItem>
            <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
          </SelectContent>
        </Select>
      ),
      cell: ({ row }) => (
        <span className="capitalize">{row.original.paymentMethod}</span>
      )
    },
    {
      accessorKey: 'status',
      header: () => (
        <Select
          value={params.status || 'all'}
          onValueChange={(value) => setFilterState((prev) => ({ ...prev, status: value !== 'all' ? value : '', page: 1 }))}
        >
          <SelectTrigger className="w-[120px] text-sm capitalize bg-transparent border-none shadow-none font-medium p-0 -ml-1 focus:ring-0 focus-visible:ring-0" onClick={e => e.stopPropagation()}>
            <SelectValue placeholder="Trạng thái (tất cả)" />
          </SelectTrigger>
          <SelectContent onClick={e => e.stopPropagation()}>
            <SelectItem value="all">Trạng thái (tất cả)</SelectItem>
            <SelectItem value="PENDING">Chờ xử lý</SelectItem>
            <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
            <SelectItem value="SHIPPED">Đang giao</SelectItem>
            <SelectItem value="DELIVERED">Đã giao</SelectItem>
            <SelectItem value="CANCELLED">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const orderId = row.original.id;
        const status = row.original.status;
        return (
          <div className="flex gap-2 text-xs" onClick={e => e.stopPropagation()}>
            {status === 'PENDING' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(orderId, 'PROCESSING')} disabled={isUpdating}>
                Chuyển: Đang xử lý
              </Button>
            )}
            {status === 'PROCESSING' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(orderId, 'SHIPPED')} disabled={isUpdating}>
                Chuyển: Đang giao
              </Button>
            )}
            {status === 'SHIPPED' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(orderId, 'DELIVERED')} disabled={isUpdating}>
                Chuyển: Đã giao
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
      </div>

      <div className="py-2">
        <input
          type="text"
          placeholder="Search by ID, name, or email..."
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
