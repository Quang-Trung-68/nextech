import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, CreditCard, Package, AlertTriangle, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import useAuthStore from '@/stores/useAuthStore';

const getIconForType = (type) => {
  const base = 'h-[18px] w-[18px]';
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
      return `/admin/products?productId=${data?.productId}`;
    default:
      return '/notifications';
  }
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { unreadCount, notifications, markOneAsRead, markAllAsRead } = useNotifications(user);

  // Click-outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markOneAsRead(notif.id);
    setIsOpen(false);
    navigate(getActionUrl(notif));
  };

  const displayNotifications = notifications.slice(0, 10);

  return (
    <div className="relative hidden md:flex" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="hover:text-apple-blue transition-colors relative flex items-center py-2 focus:outline-none"
      >
        <Bell size={22} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-[2px] -right-[8px] bg-red-500 text-white text-[10px] rounded-full min-w-[17px] h-[17px] flex items-center justify-center font-bold shadow-sm px-[3px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel — same pattern as cart/user menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-[#d2d2d7] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-[360px] z-[110] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f7]">
            <div>
              <h4 className="font-semibold text-apple-dark">Thông báo</h4>
              {unreadCount > 0 && (
                <p className="text-xs text-apple-secondary mt-0.5">{unreadCount} chưa đọc</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1.5 text-xs text-apple-blue hover:text-apple-blue/80 font-medium transition-colors bg-blue-50 px-3 py-1.5 rounded-full"
              >
                <CheckCheck size={13} />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
            {displayNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                  <Bell size={22} className="text-[#d2d2d7]" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-apple-secondary font-medium">Không có thông báo nào</p>
              </div>
            ) : (
              displayNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7] last:border-b-0 ${
                    !notif.isRead ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  {/* Icon circle */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                      {getIconForType(notif.type)}
                    </div>
                    {!notif.isRead && (
                      <span className="absolute -top-[2px] -right-[2px] w-2.5 h-2.5 bg-apple-blue rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13.5px] leading-snug ${!notif.isRead ? 'font-semibold text-apple-dark' : 'font-medium text-apple-dark'}`}>
                      {notif.title}
                    </p>
                    <p className="text-[12.5px] text-apple-secondary line-clamp-2 mt-0.5 leading-snug">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-[#aeaeb2] mt-1.5 font-medium">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#f5f5f7]">
            <button
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full text-center text-[13.5px] font-semibold text-apple-blue hover:bg-[#f5f5f7] py-2 rounded-xl transition-colors"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
