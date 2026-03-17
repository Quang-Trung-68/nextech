import { useState } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useAdminUsers, useToggleUserStatus } from '../../features/admin/hooks/useAdmin';
import { DataTable } from '../../features/admin/components/DataTable';
import { CustomPagination } from '../../features/admin/components/CustomPagination';
import { StatusBadge } from '../../features/admin/components/StatusBadge';
import { Button } from '../../components/ui/button';
import { toast } from '../../lib/toast';

const AdminUserPage = () => {
  usePageTitle('Quản lý Người dùng | Quản trị');

  const [params, setParams] = useState({ page: 1, limit: 10, search: '' });

  const { data, isLoading } = useAdminUsers(params);
  const { mutate: toggleStatus, isPending: isUpdating } = useToggleUserStatus();

  const handleToggleStatus = (userId, currentStatus) => {
    toggleStatus(
      { id: userId },
      {
        onSuccess: () => {
          const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
          toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'banned'} successfully`);
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update user status'),
      }
    );
  };

  const columns = [
    {
      accessorKey: 'avatar',
      header: 'Avatar',
      cell: ({ row }) => (
        <img
          src={row.original.avatar || 'https://via.placeholder.com/50'}
          alt={row.original.name}
          className="w-10 h-10 object-cover rounded-full"
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <StatusBadge status={row.original.role} />,
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
        const isAdmin = row.original.role === 'ADMIN';
        // Không được toggle status của ADMIN
        if (isAdmin) {
          return <span className="text-xs text-muted-foreground">N/A</span>;
        }
        return (
          <Button
            size="sm"
            variant={status === 'ACTIVE' ? 'destructive' : 'outline'}
            onClick={() => handleToggleStatus(row.original.id, status)}
            disabled={isUpdating}
          >
            {status === 'ACTIVE' ? 'Ban User' : 'Activate'}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
      </div>

      <div className="py-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="border rounded-md px-3 py-2 w-full max-w-sm"
          value={params.search}
          onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
        />
      </div>

      {isLoading ? (
        <div>Loading users...</div>
      ) : (
        <DataTable columns={columns} data={data?.users || []} />
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

export default AdminUserPage;
