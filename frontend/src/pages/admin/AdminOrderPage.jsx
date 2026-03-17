import { useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useAdminOrders, useUpdateOrderStatus } from '../../features/admin/hooks/useAdmin';
import { DataTable } from '../../features/admin/components/DataTable';
import { CustomPagination } from '../../features/admin/components/CustomPagination';
import { StatusBadge } from '../../features/admin/components/StatusBadge';
import { Button } from '../../components/ui/button';
import { toast } from '../../lib/toast';

const AdminOrderPage = () => {
  usePageTitle('Quản lý Đơn hàng | Quản trị');

  const [params, setParams] = useState({ page: 1, limit: 10, search: '' });

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
      accessorKey: '_id',
      header: 'Order ID',
      cell: ({ row }) => <span className="text-xs font-mono">{row.original._id}</span>,
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
      cell: ({ row }) => `$${row.original.totalAmount}`,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Payment',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="flex gap-2 text-xs">
            {status === 'PENDING' && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(row.original._id, 'PROCESSING')} disabled={isUpdating}>
                  Process
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(row.original._id, 'CANCELLED')} disabled={isUpdating}>
                  Cancel
                </Button>
              </>
            )}
            {status === 'PROCESSING' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange(row.original._id, 'DELIVERED')} disabled={isUpdating}>
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

      <div className="py-4">
        <input
          type="text"
          placeholder="Search by order ID or user..."
          className="border rounded-md px-3 py-2 w-full max-w-sm"
          value={params.search}
          onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
        />
      </div>

      {isLoading ? (
        <div>Loading orders...</div>
      ) : (
        <DataTable columns={columns} data={data?.orders || []} />
      )}

      {data?.totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <CustomPagination
            currentPage={params.page}
            totalPages={data.totalPages}
            onPageChange={(page) => setParams({ ...params, page })}
          />
        </div>
      )}
    </div>
  );
};

export default AdminOrderPage;
