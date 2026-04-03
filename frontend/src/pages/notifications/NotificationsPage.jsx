import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, ShoppingCart, CreditCard, Package, AlertTriangle, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import useAuthStore from '@/stores/useAuthStore';
import usePageTitle from '@/hooks/usePageTitle';
import PageBackButton from '@/components/common/PageBackButton';

const getIconForType = (type) => {
  const base = 'h-[22px] w-[22px]';
  switch (type) {
    case 'new_order':            return <ShoppingCart className={`${base} text-apple-blue`} />;
    case 'order_status_changed': return <Package className={`${base} text-green-500`} />;
    case 'payment_result':       return <CreditCard className={`${base} text-purple-500`} />;
    case 'low_stock':            return <AlertTriangle className={`${base} text-orange-400`} />;
    default:                     return <Bell className={`${base} text-apple-secondary`} />;
  }
};

const getActionUrl = (notification) => {
  const { type, data } = notification;
  switch (type) {
    case 'order_status_changed':
    case 'payment_result':
      return `/orders/${data?.orderId}`;
    case 'new_order':
      return `/admin/orders?orderId=${data?.orderId}`;
    case 'low_stock':
      return data?.productId ? `/admin/products/${data.productId}/edit` : '/admin/products';
    default:
      return '#';
  }
};

const SkeletonItem = () => (
  <div className="flex gap-4 px-6 py-5 border-b border-[#f5f5f7] animate-pulse">
    <div className="w-12 h-12 rounded-full bg-[#e8e8ed] flex-shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0 space-y-2.5 pt-1">
      <div className="h-3.5 bg-[#e8e8ed] rounded w-3/4" />
      <div className="h-3 bg-[#e8e8ed] rounded w-full" />
      <div className="h-3 bg-[#e8e8ed] rounded w-1/2" />
    </div>
  </div>
);

const NotificationsPage = () => {
  usePageTitle('Thông báo');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    unreadCount,
    notifications,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    markOneAsRead,
    markAllAsRead,
  } = useNotifications(user);

  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (isLoading || isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markOneAsRead(notification.id);
    navigate(getActionUrl(notification));
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 font-sans bg-white min-h-screen">
      {/* Page header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <PageBackButton className="mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-apple-dark mb-1">
            Thông báo
          </h1>
          {!isLoading && notifications.length > 0 && (
            <p className="text-apple-secondary text-sm">
              {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center justify-center gap-2 text-[15px] sm:text-sm text-apple-blue hover:text-apple-blue/80 font-bold sm:font-semibold transition-colors bg-blue-50 px-6 py-2 rounded-full mt-1 min-h-[44px] sm:w-auto self-start shadow-sm"
          >
            <CheckCheck size={18} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Content card */}
      <div className="rounded-3xl border border-[#d2d2d7] shadow-sm overflow-hidden bg-white">
        {/* Loading skeleton */}
        {isLoading && (
          <div>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[#f5f5f7] flex items-center justify-center mb-5">
              <Bell size={36} className="text-[#d2d2d7]" strokeWidth={1.5} />
            </div>
            <p className="text-xl font-semibold text-apple-dark mb-2">
              Không có thông báo nào
            </p>
            <p className="text-apple-secondary text-sm max-w-xs mb-8">
              Các thông báo về đơn hàng và hoạt động sẽ hiển thị tại đây.
            </p>
            <Link
              to="/phone"
              className="px-8 py-3 rounded-full bg-apple-blue text-white font-bold text-[15px] sm:text-sm hover:bg-apple-blue/90 transition-colors min-h-[44px] inline-flex items-center justify-center shadow-md active:scale-95"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        )}

        {/* Notifications list */}
        {!isLoading && notifications.length > 0 && (
          <div className="divide-y divide-[#f5f5f7]">
            {notifications.map((notif, index) => {
              const isLast = index === notifications.length - 1;
              return (
                <div
                  key={notif.id}
                  ref={isLast ? lastElementRef : null}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-5 px-6 py-5 cursor-pointer hover:bg-[#f5f5f7] transition-colors ${
                    !notif.isRead ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  {/* Icon */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center shadow-sm">
                      {getIconForType(notif.type)}
                    </div>
                    {!notif.isRead && (
                      <span className="absolute -top-[2px] -right-[2px] w-3 h-3 bg-apple-blue rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`text-[15.5px] leading-snug tracking-tight ${
                      !notif.isRead ? 'font-bold text-apple-dark' : 'font-semibold text-apple-dark'
                    }`}>
                      {notif.title}
                    </p>
                    <p className="text-[14.5px] text-gray-700 font-medium mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[13px] text-gray-500 mt-2 font-bold tracking-tight">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Loading more skeleton */}
            {isFetchingNextPage && (
              <>
                <SkeletonItem />
                <SkeletonItem />
              </>
            )}

            {/* End of list */}
            {!hasNextPage && notifications.length > 0 && (
              <div className="text-center py-5 text-sm text-apple-secondary bg-[#fafafa]">
                Bạn đã xem hết thông báo
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
