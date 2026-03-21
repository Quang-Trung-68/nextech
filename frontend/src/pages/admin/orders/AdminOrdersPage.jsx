import { useState, useEffect } from 'react';
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
import OrderDetailModal from './components/OrderDetailModal';

const AdminOrdersPage = () => {
  usePageTitle('Manage Orders | Admin');

  const [params, setParams] = useState({ page: 1, limit: 10, search: '', paymentStatus: '', status: '' });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // States for Order Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setParams(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
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
      cell: ({ row }) => <span className="text-xs font-mono">#{row.original.id.slice(-8).toUpperCase()}</span>,
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
          onValueChange={(value) => setParams((prev) => ({ ...prev, paymentStatus: value !== 'all' ? value : '', page: 1 }))}
        >
          <SelectTrigger className="w-[130px] text-sm capitalize bg-transparent border-none shadow-none font-medium p-0 -ml-1 focus:ring-0 focus-visible:ring-0" onClick={e => e.stopPropagation()}>
            <SelectValue placeholder="Payment (all)" />
          </SelectTrigger>
          <SelectContent onClick={e => e.stopPropagation()}>
            <SelectItem value="all">Payment (all)</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
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
          onValueChange={(value) => setParams((prev) => ({ ...prev, status: value !== 'all' ? value : '', page: 1 }))}
        >
          <SelectTrigger className="w-[120px] text-sm capitalize bg-transparent border-none shadow-none font-medium p-0 -ml-1 focus:ring-0 focus-visible:ring-0" onClick={e => e.stopPropagation()}>
            <SelectValue placeholder="Status (all)" />
          </SelectTrigger>
          <SelectContent onClick={e => e.stopPropagation()}>
            <SelectItem value="all">Status (all)</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                Mark Processing
              </Button>
            )}
            {status === 'PROCESSING' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(orderId, 'SHIPPED')} disabled={isUpdating}>
                Mark Shipped
              </Button>
            )}
            {status === 'SHIPPED' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(orderId, 'DELIVERED')} disabled={isUpdating}>
                Mark Delivered
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
            onPageChange={(page) => setParams({ ...params, page })}
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
