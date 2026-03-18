import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';
import { useProfileOrders } from '@/features/profile/hooks/useProfileOrders';
import OrderCard from '@/features/profile/components/OrderCard';
import OrderFilterTabs from '@/features/profile/components/OrderFilterTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

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
      <Skeleton key={i} className="h-[80px] w-full rounded-xl" />
    ))}
  </div>
);

const ProfileOrdersPage = () => {
  usePageTitle('Đơn hàng của tôi');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const [status, setStatus] = useState('');
  
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Accordion state
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const { data, isLoading, isError } = useProfileOrders({ page, status, search });

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setExpandedOrderId(null);
    setSearchParams({ page: '1' });
  };

  const handlePageChange = (newPage) => {
    setExpandedOrderId(null);
    setSearchParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setExpandedOrderId(null);
    setSearchParams({ page: '1' });
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm p-5 md:p-6">
        <h1 className="text-xl font-bold text-apple-dark tracking-tight flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-apple-blue" />
          Đơn hàng của tôi
        </h1>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full xl:w-[320px] flex-shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-secondary" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hàng..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] hover:bg-[#ebebe1] transition-colors text-sm rounded-full border border-transparent focus:outline-none focus:border-apple-blue focus:bg-white focus:ring-2 focus:ring-apple-blue/20"
            />
          </form>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between">
          <div className="flex-1 overflow-x-auto custom-scrollbar pb-1 xl:pb-0">
            <OrderFilterTabs activeStatus={status} onChange={handleStatusChange} />
          </div>
        </div>

        
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
          <p className="text-apple-secondary font-medium">
            {search ? 'Không tìm thấy đơn hàng nào khớp với tìm kiếm.' : STATUS_LABELS[status]}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.orders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              isExpanded={expandedOrderId === order.id}
              onToggle={() => toggleExpand(order.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-3">
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
            Trang {page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= data.pagination.totalPages}
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
