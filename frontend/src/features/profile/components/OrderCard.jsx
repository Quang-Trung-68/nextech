import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Package, ChevronRight } from 'lucide-react';
import { OrderStatusBadge } from '../../../features/orders/components/OrderStatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { Button } from '../../../components/ui/button';
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
} from '../../../components/ui/alert-dialog';
import { useCancelOrder } from '../hooks/useCancelOrder';
import { toast } from 'sonner';

const MAX_VISIBLE_PRODUCTS = 2;

const OrderCard = ({ order }) => {
  const { id, status, totalAmount, orderItems, createdAt } = order;
  const [isCancelled, setIsCancelled] = useState(false);
  const currentStatus = isCancelled ? 'CANCELLED' : status;

  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const visibleItems = orderItems.slice(0, MAX_VISIBLE_PRODUCTS);
  const extraCount = orderItems.length - MAX_VISIBLE_PRODUCTS;

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

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5ea] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f7] bg-apple-gray/30">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-apple-dark">
            #{id.slice(-8).toUpperCase()}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-apple-secondary">
            <Calendar className="w-3 h-3" />
            {new Date(createdAt).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <OrderStatusBadge status={currentStatus} />
      </div>

      {/* Products */}
      <div className="px-5 py-4 space-y-3">
        {visibleItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#e5e5ea] shrink-0 bg-apple-gray">
              <img
                src={item.product?.images?.[0]?.url || '/placeholder.png'}
                alt={item.product?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-apple-dark line-clamp-1">
                {item.product?.name || 'Sản phẩm'}
              </p>
              <p className="text-xs text-apple-secondary">x{item.quantity}</p>
            </div>
            <p className="text-sm font-bold text-primary shrink-0">
              {formatCurrency(item.price)}
            </p>
          </div>
        ))}

        {extraCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-apple-secondary font-medium px-1">
            <Package className="w-3.5 h-3.5" />
            + {extraCount} sản phẩm khác
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-[#f5f5f7] bg-apple-gray/20">
        <div className="text-sm">
          <span className="text-apple-secondary font-medium">Tổng tiền: </span>
          <span className="font-black text-lg text-primary">{formatCurrency(totalAmount)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Cancel button — only for PENDING */}
          {currentStatus === 'PENDING' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full text-xs font-semibold text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600"
                >
                  Huỷ đơn
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-apple-dark">
                    Xác nhận huỷ đơn
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-apple-secondary mt-2">
                    Bạn có chắc muốn huỷ đơn hàng <b>#{id.slice(-6).toUpperCase()}</b>? Không thể hoàn tác.
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
            className="h-8 rounded-full text-xs font-semibold bg-apple-blue hover:bg-apple-blue/90 text-white"
          >
            <Link to={`/profile/orders/${id}`} className="flex items-center gap-1.5">
              Xem chi tiết
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
