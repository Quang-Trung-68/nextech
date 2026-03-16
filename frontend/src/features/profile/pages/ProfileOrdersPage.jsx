import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import usePageTitle from '../../../hooks/usePageTitle';
import { useProfileOrders } from '../hooks/useProfileOrders';
import OrderCard from '../components/OrderCard';
import OrderFilterTabs from '../components/OrderFilterTabs';
import { Skeleton } from '../../../components/ui/skeleton';
import { Button } from '../../../components/ui/button';

const STATUS_LABELS = {
  '': 'Bạn chưa có đơn hàng nào.',
  PENDING: 'Không có đơn hàng nào đang chờ xử lý.',
  PROCESSING: 'Không có đơn hàng nào đang xử lý.',
  SHIPPED: 'Không có đơn hàng nào đang giao.',
  DELIVERED: 'Không có đơn hàng nào đã giao.',
  CANCELLED: 'Không có đơn hàng nào đã huỷ.',
};

const OrderSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-[180px] w-full rounded-2xl" />
    ))}
  </div>
);

const ProfileOrdersPage = () => {
  usePageTitle('Đơn hàng của tôi');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const [status, setStatus] = useState('');

  const { data, isLoading, isError } = useProfileOrders({ page, status });

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setSearchParams({ page: '1' });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-5 md:p-6">
        <h1 className="text-lg font-bold text-apple-dark tracking-tight flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-apple-blue" />
          Đơn hàng của tôi
        </h1>
        <OrderFilterTabs activeStatus={status} onChange={handleStatusChange} />
      </div>

      {/* Content */}
      {isLoading ? (
        <OrderSkeleton />
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-8 text-center text-apple-secondary">
          Không thể tải đơn hàng. Vui lòng thử lại.
        </div>
      ) : !data?.orders?.length ? (
        <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-12 text-center">
          <Package className="w-12 h-12 text-[#d2d2d7] mx-auto mb-4" />
          <p className="text-apple-secondary font-medium">{STATUS_LABELS[status]}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-full gap-1.5 font-medium border-[#d2d2d7]"
          >
            <ChevronLeft className="w-4 h-4" />
            Trước
          </Button>
          <span className="text-sm text-apple-secondary font-medium">
            Trang {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= data.totalPages}
            className="rounded-full gap-1.5 font-medium border-[#d2d2d7]"
          >
            Sau
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfileOrdersPage;
