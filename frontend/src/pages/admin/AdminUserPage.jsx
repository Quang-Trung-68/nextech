import { useState,useEffect } from 'react';
import usePageTitle from '../../hooks/usePageTitle';
import { useAdminUsers, useToggleUserStatus } from '../../features/admin/hooks/useAdmin';
import { DataTable } from '../../features/admin/components/DataTable';
import { CustomPagination } from '../../features/admin/components/CustomPagination';
import { StatusBadge } from '../../features/admin/components/StatusBadge';
import { ConfirmDialog } from '../../features/admin/components/ConfirmDialog';
import { Button } from '../../components/ui/button';
import { toast } from '../../lib/toast';
import { useDebounce } from '../../hooks/useDebounce';
import useAuthStore from '../../stores/useAuthStore';

const AdminUserPage = () => {
  usePageTitle('Quản lý Người dùng | Quản trị');

  const currentUser = useAuthStore((s) => s.user);
  const [params, setParams] = useState({ page: 1, limit: 10, search: '' });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    setParams(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const { data, isLoading } = useAdminUsers(params);
  const { mutate: toggleStatus, isPending: isUpdating } = useToggleUserStatus();
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });

  const executeToggleStatus = () => {
    if (!confirmModal.user) return;
    const { id, status } = confirmModal.user;
    toggleStatus(
      { id },
      {
        onSuccess: () => {
          const newStatus = status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
          toast.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'banned'} successfully`);
          setConfirmModal({ isOpen: false, user: null });
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Failed to update user status');
          setConfirmModal({ isOpen: false, user: null });
        },
      }
    );
  };

  const handleToggleStatusClick = (userRow) => {
    setConfirmModal({ isOpen: true, user: userRow });
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {currentUser?.id === row.original.id && (
            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
              Me
            </span>
          )}
        </div>
      ),
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
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'BANNED'} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        const isAdmin = row.original.role === 'ADMIN';
        const isSelf = currentUser?.id === row.original.id;
        // Không được toggle status của ADMIN và của chính mình
        if (isAdmin || isSelf) {
          return <span className="text-xs text-muted-foreground">N/A</span>;
        }
        return (
          <Button
            size="sm"
            variant={isActive ? 'destructive' : 'outline'}
            onClick={() => handleToggleStatusClick({ id: row.original.id, status: isActive ? 'ACTIVE' : 'BANNED', name: row.original.name })}
            disabled={isUpdating}
          >
            {isActive ? 'Ban User' : 'Activate'}
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
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div>Loading users...</div>
      ) : (
        <DataTable columns={columns} data={data?.users || []} />
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

      {/* Confirm Dialog cho tác vụ Toggle Status */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null })}
        onConfirm={executeToggleStatus}
        title={confirmModal.user?.status === 'ACTIVE' ? 'Deactivate User?' : 'Activate User?'}
        description={`Are you sure you want to ${confirmModal.user?.status === 'ACTIVE' ? 'ban' : 'activate'} ${confirmModal.user?.name}?`}
        confirmText={confirmModal.user?.status === 'ACTIVE' ? 'Ban User' : 'Activate'}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default AdminUserPage;
