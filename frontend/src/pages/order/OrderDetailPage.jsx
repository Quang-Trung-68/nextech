import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import usePageTitle from '@/hooks/usePageTitle';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrder, useCancelOrder } from '@/features/orders/hooks/useOrder';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { formatVND } from '@/utils/price';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  MapPin,
  Package,
  CreditCard,
  ArrowLeft,
  Calendar,
  Phone,
  User,
  AlertCircle,
  PenLine,
  CheckCircle,
  Copy,
} from 'lucide-react';
import WriteReviewModal from '@/features/reviews/WriteReviewModal';
import axiosInstance from '@/lib/axios';
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
import { toast } from 'sonner';

const OrderDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isSuccessPage = searchParams.get('success') === 'true';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  usePageTitle(isSuccessPage ? 'Đặt hàng thành công' : `Chi tiết đơn hàng #${id.toUpperCase()}`);

  const { data: order, isLoading, isError } = useOrder(id);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const [isCancelled, setIsCancelled] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // item hiện đang được review
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const currentStatus = isCancelled ? 'CANCELLED' : order?.status;

  // Query reviewable items — chỉ khi order đã DELIVERED
  const { data: reviewableData } = useQuery({
    queryKey: ['reviewable-items', id],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/orders/${id}/reviewable-items`);
      return data; // { success, items }
    },
    enabled: !!id && currentStatus === 'DELIVERED',
    staleTime: 0,
  });

  // Map: orderItemId → hasReviewed (để lookup nhanh theo item)
  const reviewableMap = Object.fromEntries(
    (reviewableData?.items ?? []).map((ri) => [ri.orderItemId, ri])
  );

  const handleOpenReviewModal = (item) => {
    setSelectedItem(item);
    setReviewModalOpen(true);
  };

  // Clear cart only once when success page runs
  useEffect(() => {
    if (isSuccessPage) {
      queryClient.invalidateQueries(['cart']);
    }
  }, [isSuccessPage, queryClient]);

  const handleCancelOrder = () => {
    cancelOrder({ id, reason: 'Người dùng tự hủy đơn hàng' }, {
      onSuccess: () => {
        toast.success('Đã huỷ đơn hàng thành công');
        setIsCancelled(true);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Có lỗi khi huỷ đơn hàng');
      }
    });
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(id.toUpperCase());
    toast.success('Đã sao chép mã đơn hàng');
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground opacity-50 block mb-4" />
        <h2 className="text-2xl font-bold tracking-tight text-apple-dark mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-muted-foreground w-full max-w-sm mb-8">
          Đơn hàng này có thể không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Button onClick={() => navigate('/profile/orders')} variant="outline" className="rounded-full px-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Về danh sách đơn hàng
        </Button>
      </div>
    );
  }

  const { shippingAddress, orderItems, totalAmount, paymentMethod, createdAt } = order;

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* SUCCESS BANNER */}
      {isSuccessPage && (
        <div className="bg-green-50/50 border border-green-100 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
             <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-apple-dark tracking-tight mb-4">
            Cảm ơn bạn đã đặt hàng!
          </h1>
          <p className="text-apple-secondary text-base lg:text-lg w-full max-w-xl mb-8 leading-relaxed">
            Đơn hàng <span className="font-bold text-apple-dark font-mono tracking-tight hidden sm:inline">#{id.toUpperCase()}</span><span className="font-bold text-apple-dark font-mono tracking-tight sm:hidden">#{id.substring(0, 8).toUpperCase()}...</span> của bạn đã được tiếp nhận và xử lý. 
            Chúng tôi sẽ cập nhật trạng thái đơn hàng qua email cho bạn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
             <Button asChild size="lg" className="rounded-full font-semibold shadow-sm px-8 h-12 bg-apple-blue hover:bg-apple-blue/90">
               <Link to="/profile/orders">Xem đơn hàng của tôi</Link>
             </Button>
             <Button asChild variant="outline" size="lg" className="rounded-full font-semibold px-8 h-12">
               <Link to="/">Tiếp tục mua sắm</Link>
             </Button>
          </div>
        </div>
      )}

      {/* NORMAL DETAIL HEADER */}
      {!isSuccessPage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1 sm:gap-3 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full -ml-2 text-muted-foreground min-w-[44px] min-h-[44px]">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-apple-dark tracking-tight shrink-0 font-mono flex items-center gap-2">
                Đơn hàng <span className="hidden sm:inline">#{id.toUpperCase()}</span><span className="sm:hidden">#{id.substring(0, 8).toUpperCase()}...</span>
                <button 
                  onClick={handleCopyOrderId} 
                  className="p-1.5 text-apple-secondary hover:text-apple-blue hover:bg-blue-50 rounded-md transition-colors" 
                  title="Sao chép mã"
                >
                  <Copy size={20} />
                </button>
              </h1>
            </div>
            <div className="flex items-center text-sm text-apple-secondary ml-10 gap-4">
               <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
          
          <div className="sm:text-right pl-10 sm:pl-0">
            <OrderStatusBadge status={currentStatus} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_380px] gap-6 lg:gap-10 items-start">
        {/* Left Column: Products List */}
        <div className="bg-white border text-card-foreground rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-apple-dark tracking-tight mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-apple-blue" />
            Sản phẩm đã đặt
          </h2>
          
          <div className="flex flex-col gap-6">
            {orderItems.map((item) => {
              // discountPercent là từ _addOrderItemDiscounts trên server (snapshot)
              const discountPercent = item.discountPercent || 0;
              const lineTotal = Number(item.price) * item.quantity;
              
              return (
                <div key={item.id} className="flex gap-4 sm:gap-6 pb-6 border-b border-[#f5f5f7] last:border-0 last:pb-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-apple-gray border">
                    <img 
                      src={item.product?.images?.[0]?.url || '/placeholder.png'} 
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <h3 className="font-semibold text-apple-dark line-clamp-2 md:text-lg leading-tight">
                      {item.product?.name || 'Sản phẩm không rõ'}
                    </h3>
                    <p className="text-sm text-apple-secondary">SL: {item.quantity}</p>
                    
                    {/* Giá theo snapshot */}
                    <div className="flex items-center gap-2 mt-1">
                      {discountPercent > 0 && item.originalPrice != null ? (
                        <>
                          <span className="text-sm line-through text-gray-400">{formatVND(item.originalPrice)}</span>
                          <span className="font-bold text-red-500">{formatVND(item.price)}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                            -{discountPercent}%
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-primary">{formatVND(item.price)}</span>
                      )}
                    </div>
                    
                    {/* Line total */}
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <span className="text-xs text-apple-secondary"></span>
                      <span className="font-bold text-apple-dark">{formatVND(lineTotal)}</span>
                    </div>

                    {/* Review actions — chỉ hiện khi DELIVERED */}
                    {currentStatus === 'DELIVERED' && reviewableMap[item.id] !== undefined && (
                      <div className="mt-3">
                        {reviewableMap[item.id].hasReviewed ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            Đã đánh giá
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="min-h-[44px] rounded-full text-sm font-medium px-4 border-blue-200 text-apple-blue hover:bg-blue-50"
                            onClick={() =>
                              handleOpenReviewModal({
                                orderItemId: item.id,
                                productId: item.productId,
                                productName: item.product?.name,
                                productImage: item.product?.images?.[0]?.url ?? null,
                              })
                            }
                          >
                            <PenLine className="w-3.5 h-3.5 mr-1.5" />
                            Viết đánh giá
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          {!isSuccessPage && currentStatus === 'PENDING' && (
            <div className="mt-8 pt-8 border-t flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border shadow-sm px-6 text-destructive border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 font-semibold h-12 md:h-10 text-base md:text-sm">
                    Huỷ đơn hàng này
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-apple-dark">Xác nhận huỷ đơn</AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-apple-secondary mt-2">
                      Bạn có chắc chắn muốn huỷ đơn hàng <b className="font-mono tracking-tight">#{id.toUpperCase()}</b> này không? 
                      Sẽ không thể hoàn tác sau khi xác nhận.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-2">
                    <AlertDialogCancel className="rounded-full px-6 font-medium border-[#d2d2d7] h-12 md:h-10 mt-0">Giữ lại đơn hàng</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelOrder} 
                      className="bg-destructive hover:bg-destructive/90 text-white rounded-full px-6 font-semibold h-12 md:h-10"
                      disabled={isCancelling}
                    >
                      {isCancelling ? 'Đang huỷ...' : 'Vâng, Huỷ đơn hàng'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Right Column: Order Info & Summary */}
        <div className="flex flex-col gap-6 sticky top-24">
          
          <div className="bg-apple-gray/40 border border-[#f5f5f7] rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-apple-dark tracking-tight mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-apple-blue" />
              Giao hàng đến
            </h2>
            <div className="space-y-4 text-[15px] text-apple-dark">
              <p className="flex items-start gap-3">
                <User className="w-4 h-4 text-apple-secondary mt-0.5" /> 
                <span className="font-semibold">{shippingAddress.fullName}</span>
              </p>
              <p className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-apple-secondary mt-0.5" />
                <span>{shippingAddress.phone}</span>
              </p>
              <p className="flex items-start gap-3 text-apple-secondary">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span className="leading-relaxed">
                  {shippingAddress.addressLine}<br />
                  {shippingAddress.ward}, {shippingAddress.city}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#d2d2d7] shadow-sm rounded-2xl p-6 md:p-8">
            <h2 className="text-lg font-bold text-apple-dark tracking-tight mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-apple-blue" />
              Tổng quan
            </h2>
            
            <div className="space-y-3 text-[14px] text-apple-secondary mb-6">
              <div className="flex justify-between items-center">
                <span>Tạm tính</span>
                <span className="font-medium text-apple-dark">{formatVND(Number(totalAmount) + Number(order.discountAmount || 0))}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center gap-1">
                    Giảm giá
                    {order.coupon && (
                      <span className="font-mono text-[10px] bg-green-100 text-green-700 rounded px-1 py-0.5 font-bold tracking-wider">
                        {order.coupon.code}
                      </span>
                    )}
                  </span>
                  <span className="font-medium">− {formatVND(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Vận chuyển</span>
                <span className="font-medium text-green-600">Miễn phí</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f5f5f7] flex justify-between items-end mb-6">
              <span className="text-base font-bold text-apple-dark">Tổng tiền</span>
              <span className="text-2xl font-black text-primary">{formatVND(totalAmount)}</span>
            </div>

            <div className={`p-4 rounded-xl flex flex-col gap-1 items-center justify-center text-center ${paymentMethod === 'STRIPE' ? 'bg-blue-50/50 text-blue-700 border border-blue-100' : 'bg-green-50/50 text-green-700 border border-green-100'}`}>
              <span className="text-xs uppercase font-bold tracking-wider opacity-70">Phương thức</span>
              <span className="text-sm font-semibold">
                {paymentMethod === 'STRIPE' ? 'Thẻ Ngân Hàng' : 'Thanh toán tiền mặt (COD)'}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* WriteReviewModal — 1 instance duy nhất, controlled bởi selectedItem */}
      <WriteReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        item={selectedItem}
        orderId={id}
      />
    </div>
  );
};

export default OrderDetailPage;
