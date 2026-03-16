import { useState } from 'react';
import { MapPin, Plus, AlertCircle } from 'lucide-react';
import usePageTitle from '../../../hooks/usePageTitle';
import { useAddresses } from '../hooks/useAddresses';
import AddressCard from '../components/AddressCard';
import AddressFormDialog from '../components/AddressFormDialog';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';

const MAX_ADDRESSES = 5;

const AddressSkeleton = () => (
  <div className="space-y-3">
    {[1, 2].map((i) => (
      <Skeleton key={i} className="h-[160px] w-full rounded-2xl" />
    ))}
  </div>
);

const ProfileAddressesPage = () => {
  usePageTitle('Địa chỉ giao hàng');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const { data: addresses = [], isLoading, isError } = useAddresses();

  const handleOpenCreate = () => {
    setEditingAddress(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
  };

  const isAtLimit = addresses.length >= MAX_ADDRESSES;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-lg font-bold text-apple-dark tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-apple-blue" />
            Địa chỉ giao hàng
          </h1>

          <div className="flex items-center gap-3">
            {isAtLimit && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Đã đạt giới hạn {MAX_ADDRESSES} địa chỉ
              </span>
            )}
            <Button
              onClick={handleOpenCreate}
              disabled={isAtLimit}
              className="rounded-full px-5 font-semibold bg-apple-blue hover:bg-apple-blue/90 h-9 text-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm địa chỉ mới
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <AddressSkeleton />
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-8 text-center text-apple-secondary">
          Không thể tải danh sách địa chỉ. Vui lòng thử lại.
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-12 text-center">
          <MapPin className="w-12 h-12 text-[#d2d2d7] mx-auto mb-4" />
          <p className="text-apple-secondary font-medium mb-4">Bạn chưa có địa chỉ giao hàng nào.</p>
          <Button
            onClick={handleOpenCreate}
            className="rounded-full px-6 font-semibold bg-apple-blue hover:bg-apple-blue/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm địa chỉ đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              totalCount={addresses.length}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <AddressFormDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        editingAddress={editingAddress}
      />
    </div>
  );
};

export default ProfileAddressesPage;
