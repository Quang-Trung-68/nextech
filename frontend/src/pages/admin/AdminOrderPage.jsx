import { useState, useEffect } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useDebounce } from '../../hooks/useDebounce';
import { useAdminOrders, useUpdateOrderStatus } from '../../features/admin/hooks/useAdmin';
import { DataTable } from '../../features/admin/components/DataTable';
import { CustomPagination } from '../../features/admin/components/CustomPagination';
import { StatusBadge } from '../../features/admin/components/StatusBadge';
import { Button } from '../../components/ui/button';
import { toast } from '../../lib/toast';
import { formatCurrency } from '../../utils/formatCurrency';

const AdminOrderPage = () => {
  usePageTitle('Quản lý Đơn hàng | Quản trị');

  const [params, setParams] = useState({ page: 1, limit: 10, search: '', paymentStatus: '', status: '' });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setParams(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const { data, isLoading } = useAdminOrders(params);
  const { mutate: updateOrderStatus, isPending: isUpdating } = useUpdateOrderStatus();

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(
      { id: orderId, status: newStatus },
      {
        onSuccess: () => toast.success('Order status updated successfully'),
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
      }
    );
  };

  const columns = [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: ({ row }) => <span className="text-xs font-mono">{row.original.id}</span>,
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
        <select
          className="bg-transparent font-medium cursor-pointer focus:outline-none -ml-1"
          value={params.paymentStatus}
          onChange={(e) => setParams(prev => ({ ...prev, paymentStatus: e.target.value, page: 1 }))}
        >
          <option value="">Payment (All)</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      ),
    },
    {
      accessorKey: 'status',
      header: () => (
        <select
          className="bg-transparent font-medium cursor-pointer focus:outline-none -ml-1"
          value={params.status}
          onChange={(e) => setParams(prev => ({ ...prev, status: e.target.value, page: 1 }))}
        >
          <option value="">Status (All)</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex gap-2 text-xs">
            {status === 'PROCESSING' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(row.original.id, 'SHIPPED')} disabled={isUpdating}>
                Mark Shipped
              </Button>
            )}
            {status === 'SHIPPED' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(row.original.id, 'DELIVERED')} disabled={isUpdating}>
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
        <div>Loading orders...</div>
      ) : (
        <DataTable columns={columns} data={data?.orders || []} />
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
    </div>
  );
};

export default AdminOrderPage;
