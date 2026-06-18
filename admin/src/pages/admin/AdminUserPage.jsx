import React, { useState, useMemo } from 'react';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import usePageTitle from '@/hooks/usePageTitle';
import { useAdminUsers, useToggleUserStatus } from '@/features/admin/hooks/useAdmin';
import { DataTable } from '@/features/admin/components/DataTable';
import { CustomPagination } from '@/features/admin/components/CustomPagination';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useDebounce } from '@/hooks/useDebounce';
import useAuthStore from '@/stores/useAuthStore';

const AdminUserPage = () => {
  usePageTitle('Người dùng | Quản trị');

  const currentUser = useAuthStore((s) => s.user);
  const [filterState, setFilterState] = useState({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const params = useMemo(
    () => ({ ...filterState, search: debouncedSearch }),
    [debouncedSearch, filterState]
  );

  React.useEffect(() => {
    setFilterState((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearch]);

  const { data, isLoading } = useAdminUsers(params);
  const { mutate: toggleStatus, isPending: isUpdating } = useToggleUserStatus();
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });
  const [addressModal, setAddressModal] = useState({ isOpen: false, user: null });

  const handleViewAddresses = (user) => {
    setAddressModal({ isOpen: true, user });
  };

  const executeToggleStatus = () => {
    if (!confirmModal.user) return;
    const { id, status } = confirmModal.user;
    toggleStatus(
      { id },
      {
        onSuccess: () => {
          const newStatus = status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
          toast.success(newStatus === 'ACTIVE' ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
          setConfirmModal({ isOpen: false, user: null });
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Không cập nhật được trạng thái');
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
      header: 'Ảnh',
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
      header: 'Tên',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {currentUser?.id === row.original.id && (
            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
              Bạn
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
      accessorKey: 'isActive',
      header: 'Trạng thái',
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'ACTIVE' : 'BANNED'} />,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        const isSelf = currentUser?.id === row.original.id;
        
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewAddresses(row.original)}
              className="flex items-center gap-1 hover:border-apple-blue hover:text-apple-blue h-8"
            >
              <MapPin className="h-3.5 w-3.5" />
              Địa chỉ
            </Button>
            
            {!isSelf && (
              <Button
                size="sm"
                variant={isActive ? 'destructive' : 'outline'}
                onClick={() => handleToggleStatusClick({ id: row.original.id, status: isActive ? 'ACTIVE' : 'BANNED', name: row.original.name })}
                disabled={isUpdating}
                className="h-8"
              >
                {isActive ? 'Khóa' : 'Kích hoạt'}
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
        <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
      </div>

      <div className="py-4">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc email..."
          className="border rounded-md px-3 py-2 w-full max-w-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <DataTable columns={columns} data={data?.users || []} />
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

      {/* Confirm Dialog cho tác vụ Toggle Status */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null })}
        onConfirm={executeToggleStatus}
        title={confirmModal.user?.status === 'ACTIVE' ? 'Khóa tài khoản?' : 'Kích hoạt tài khoản?'}
        description={`Bạn có chắc muốn ${confirmModal.user?.status === 'ACTIVE' ? 'khóa' : 'kích hoạt'} người dùng ${confirmModal.user?.name}?`}
        confirmText={confirmModal.user?.status === 'ACTIVE' ? 'Khóa' : 'Kích hoạt'}
        isLoading={isUpdating}
      />

      {/* Modal xem địa chỉ của người dùng */}
      <Dialog open={addressModal.isOpen} onOpenChange={(open) => !open && setAddressModal({ isOpen: false, user: null })}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <MapPin className="h-5 w-5 text-apple-blue" />
              Địa chỉ của {addressModal.user?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {addressModal.user?.addresses?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground italic text-sm">
                Khách hàng chưa cập nhật địa chỉ nào.
              </div>
            ) : (
              addressModal.user?.addresses?.map((addr) => (
                <div 
                  key={addr.id} 
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    addr.isDefault 
                      ? 'border-apple-blue bg-blue-50/20 shadow-sm shadow-blue-500/5' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-sm">{addr.fullName}</span>
                    <div className="flex items-center gap-2">
                      {addr.isDefault && (
                        <span className="text-[10px] bg-apple-blue/15 text-apple-blue font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
                          Mặc định
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                    <p className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold w-12">SĐT:</span>
                      <span className="text-slate-800 font-semibold">{addr.phone}</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-semibold w-12 flex-shrink-0">Địa chỉ:</span>
                      <span className="text-slate-800 leading-relaxed">
                        {addr.address}
                        {addr.ward && `, ${addr.ward}`}
                        {addr.city && `, ${addr.city}`}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end pt-2 border-t border-black/[0.04]">
            <Button onClick={() => setAddressModal({ isOpen: false, user: null })} variant="secondary">
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserPage;
