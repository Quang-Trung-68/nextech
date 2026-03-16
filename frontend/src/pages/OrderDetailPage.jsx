import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { useQueryClient } from '@tanstack/react-query';
import { useOrder, useCancelOrder } from '../features/orders/hooks/useOrder';
import { OrderStatusBadge } from '../features/orders/components/OrderStatusBadge';
import { formatCurrency } from '../utils/formatCurrency';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { 
  CheckCircle2, 
  MapPin, 
  Package, 
  CreditCard, 
  ArrowLeft,
  Calendar,
  Phone,
  User,
  AlertCircle
} from 'lucide-react';
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
} from "../components/ui/alert-dialog";
import { toast } from 'sonner';

const OrderDetailPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isSuccessPage = searchParams.get('success') === 'true';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  usePageTitle(isSuccessPage ? 'Đặt hàng thành công' : `Chi tiết đơn hàng #${id.slice(-6).toUpperCase()}`);

  const { data: order, isLoading, isError } = useOrder(id);
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder();

  const [isCancelled, setIsCancelled] = useState(false);

  // Clear cart only once when success page runs
  useEffect(() => {
    if (isSuccessPage) {
      queryClient.invalidateQueries(['cart']);
    }
  }, [isSuccessPage, queryClient]);

  const handleCancelOrder = () => {
    cancelOrder(id, {
      onSuccess: () => {
        toast.success('Đã huỷ đơn hàng thành công');
        setIsCancelled(true);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Có lỗi khi huỷ đơn hàng');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 space-y-8">
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

  const { shippingAddress, orderItems, totalAmount, paymentMethod, status, createdAt } = order;
  const currentStatus = isCancelled ? 'CANCELLED' : status;

  return (
    <div className="container max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      
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
            Đơn hàng <span className="font-bold text-apple-dark">#{id.slice(-8).toUpperCase()}</span> của bạn đã được tiếp nhận và xử lý. 
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
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full -ml-2 text-muted-foreground w-8 h-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-extrabold text-apple-dark tracking-tight shrink-0">
                Đơn hàng #{id.slice(-6).toUpperCase()}
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
            {orderItems.map((item) => (
              <div key={item.id} className="flex gap-4 sm:gap-6 pb-6 border-b border-[#f5f5f7] last:border-0 last:pb-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-apple-gray border">
                  <img 
                    src={item.product?.images?.[0]?.url || '/placeholder.png'} 
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-semibold text-apple-dark line-clamp-2 md:text-lg leading-tight mb-2">
                    {item.product?.name || 'Sản phẩm không rõ'}
                  </h3>
                  <div className="flex items-center justify-between w-full mt-auto">
                    <p className="text-sm text-apple-secondary font-medium">SL: {item.quantity}</p>
                    <p className="font-bold text-primary">{formatCurrency(item.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          {!isSuccessPage && currentStatus === 'PENDING' && (
            <div className="mt-8 pt-8 border-t flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border h-9 shadow-sm px-6 text-destructive border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 font-semibold">
                    Huỷ đơn hàng này
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-apple-dark">Xác nhận huỷ đơn</AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-apple-secondary mt-2">
                      Bạn có chắc chắn muốn huỷ đơn hàng <b>#{id.slice(-6).toUpperCase()}</b> này không? 
                      Sẽ không thể hoàn tác sau khi xác nhận.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="rounded-full px-6 font-medium border-[#d2d2d7]">Giữ lại đơn hàng</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelOrder} 
                      className="bg-destructive hover:bg-destructive/90 text-white rounded-full px-6 font-semibold"
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
                <MapPin className="w-4 h-4 mt-0.5 opacity-0" />
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
                <span className="font-medium text-apple-dark">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Vận chuyển</span>
                <span className="font-medium text-green-600">Miễn phí</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#f5f5f7] flex justify-between items-end mb-6">
              <span className="text-base font-bold text-apple-dark">Tổng tiền</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(totalAmount)}</span>
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
    </div>
  );
};

export default OrderDetailPage;
