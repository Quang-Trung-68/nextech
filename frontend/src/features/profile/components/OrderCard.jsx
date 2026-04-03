import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Package, ChevronRight, ChevronDown, Copy } from 'lucide-react';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { formatCurrency } from '@/utils/formatCurrency';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCancelOrder } from '@/features/profile/hooks/useCancelOrder';
import { toast } from 'sonner';
import { VariantOptionBadges } from '@/components/product/VariantOptionBadges';
import { orderItemSummaryLine } from '@/utils/orderItemLabel';

const OrderCard = ({ order, isExpanded, onToggle }) => {
  const { id, status, totalAmount, orderItems, createdAt } = order;
  const [isCancelled, setIsCancelled] = useState(false);
  const currentStatus = isCancelled ? 'CANCELLED' : status;

  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const handleCancel = () => {
    cancelOrder(id, {
      onSuccess: () => {
        toast.success('Đã huỷ đơn hàng thành công.');
        setIsCancelled(true);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Có lỗi khi huỷ đơn hàng.');
      },
    });
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      toast.success('Đã copy mã đơn hàng: ' + id.toUpperCase());
    });
  };

  const summaryNames = orderItems.map(orderItemSummaryLine).join(', ');

  return (
    <div 
      className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
        isExpanded 
          ? 'border-apple-blue shadow-md ring-1 ring-apple-blue/20 z-10 relative mt-4 mb-4' 
          : 'border-[#e5e5ea] hover:border-[#d2d2d7] hover:bg-[#fcfcff]'
      }`}
    >
      {/* Main Trigger Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 md:px-6 md:py-5 gap-4">
        <div className="flex-1 min-w-0 flex items-start sm:items-center gap-4 w-full">
          {/* Status & ID */}
          <div className="flex-shrink-0 w-auto sm:w-[240px] max-w-full">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="block text-[13px] font-bold text-apple-dark font-mono tracking-tight truncate max-w-[150px] sm:max-w-none" title={`#${id}`}>
                #{id.toUpperCase()}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-apple-secondary hover:text-apple-blue p-1 rounded-md hover:bg-apple-gray transition-colors shrink-0"
                title="Copy mã đơn hàng"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <OrderStatusBadge status={currentStatus} />
          </div>
          
          {/* Summary Info */}
          <div className="flex-1 min-w-0 hidden md:block pl-2 sm:pl-4 sm:border-l sm:border-[#e5e5ea]">
            <p className="text-sm text-apple-dark font-medium truncate mb-1" title={summaryNames}>
              {summaryNames}
            </p>
            <span className="flex items-center gap-1.5 text-xs text-apple-secondary">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(createdAt).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Price & Expand Icon */}
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
          {/* Mobile Summary */}
          <div className="md:hidden flex-1 min-w-0 pr-4">
            <p className="text-sm text-apple-dark font-medium truncate mb-1">
              {summaryNames}
            </p>
            <span className="block text-xs text-apple-secondary">
              {new Date(createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
            
          <div className="text-right flex-shrink-0">
            <span className="block font-bold text-primary">{formatCurrency(totalAmount)}</span>
            <span className="text-xs text-apple-secondary">{orderItems.length} sản phẩm</span>
          </div>
          
          <button 
            onClick={onToggle}
            className={`p-2 rounded-full transition-colors flex-shrink-0 cursor-pointer ${isExpanded ? 'bg-apple-blue/10 text-apple-blue hover:bg-apple-blue/20' : 'bg-[#f5f5f7] hover:bg-[#ebebe1] text-apple-secondary hover:text-apple-dark'}`}
            title="Xem chi tiết"
          >
            <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden bg-[#fafafa]">
          <div className="p-5 border-t border-[#f0f0f0]">
            <h4 className="text-sm font-semibold text-apple-dark mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-apple-secondary" />
              Chi tiết sản phẩm
            </h4>
            
            <div className="space-y-3 mb-5">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-[#f0f0f0]">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#e5e5ea] shrink-0 bg-white">
                    <img
                      src={item.product?.images?.[0]?.url || '/placeholder.png'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-apple-dark line-clamp-1 leading-tight">
                      {item.product?.name || 'Sản phẩm'}
                    </p>
                    {item.variantOptions?.length ? (
                      <VariantOptionBadges options={item.variantOptions} className="mt-1" />
                    ) : item.variantSummary ? (
                      <p className="text-[11px] text-apple-secondary mt-1">
                        Loại: {item.variantSummary}
                      </p>
                    ) : null}
                    <p className="text-xs text-apple-secondary mt-1">Số lượng: {item.quantity}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {(item.discountPercent ?? 0) > 0 && item.originalPrice != null ? (
                      <>
                        <span className="block text-sm font-semibold text-red-600">{formatCurrency(item.price)}</span>
                        <span className="block text-xs line-through text-muted-foreground">{formatCurrency(item.originalPrice)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-apple-dark">{formatCurrency(item.price)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f0f0]">
              {/* Cancel button — only for PENDING */}
              {currentStatus === 'PENDING' && (
                <AlertDialog>
                  <AlertDialogTrigger className="h-9 px-4 rounded-full text-sm font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors inline-flex items-center justify-center">
                    Huỷ đơn hàng
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold text-apple-dark">
                        Xác nhận huỷ đơn
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-base text-apple-secondary mt-2">
                        Bạn có chắc muốn huỷ đơn hàng <b className="font-mono tracking-tight">#{id.toUpperCase()}</b>? Không thể hoàn tác thao tác này.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                      <AlertDialogCancel className="rounded-full px-6 font-medium border-[#d2d2d7]">
                        Giữ lại
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="bg-destructive hover:bg-destructive/90 text-white rounded-full px-6 font-semibold"
                      >
                        {isCancelling ? 'Đang huỷ...' : 'Xác nhận huỷ'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button
                asChild
                size="sm"
                className="h-9 rounded-full text-sm font-medium bg-apple-blue hover:bg-apple-blue/90 text-white"
              >
                <Link to={`/profile/orders/${id}`} className="flex items-center gap-1.5 px-4">
                  Xem chi tiết đầy đủ
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
