import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, CreditCard, Package, AlertTriangle, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useNotifications';
import useAuthStore from '@/stores/useAuthStore';

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
      return '/notifications';
  }
};

const PANEL_MAX_W = 420;
const PANEL_MIN_W = 280;

const NotificationDropdown = ({ variant = 'default' }) => {
  const isSidebar = variant === 'sidebar';
  const [isOpen, setIsOpen] = useState(false);
  const [sidebarPanelStyle, setSidebarPanelStyle] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { unreadCount, notifications, markOneAsRead, markAllAsRead } = useNotifications(user);

  const updateSidebarPanelPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    const pad = 8;
    const rightSpace = window.innerWidth - r.right - gap - pad;
    let width = Math.min(PANEL_MAX_W, Math.max(PANEL_MIN_W, rightSpace));
    let left = r.right + gap;
    if (left + width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - pad - width);
    }
    const maxH = Math.min(480, window.innerHeight - 16);
    let top = r.top;
    if (top + maxH > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - pad - maxH);
    }
    setSidebarPanelStyle({ top, left, width, maxHeight: maxH });
  };

  useLayoutEffect(() => {
    if (!isOpen || !isSidebar) return;
    updateSidebarPanelPosition();
    const onWin = () => updateSidebarPanelPosition();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [isOpen, isSidebar]);

  // Click-outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      const t = event.target;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setIsOpen(false);
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

  const panelSurface =
    'bg-white border border-[#d2d2d7] rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col';

  const panelInner = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f5f7] shrink-0">
        <div>
          <h4 className="font-bold text-[17px] text-apple-dark tracking-tight">Thông báo</h4>
          {unreadCount > 0 && (
            <p className="text-[13px] font-medium text-apple-secondary mt-0.5">{unreadCount} chưa đọc</p>
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
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar min-h-0">
        {displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-14 h-14 rounded-full bg-[#f5f5f7] flex items-center justify-center">
              <Bell size={26} className="text-[#d2d2d7]" strokeWidth={1.5} />
            </div>
            <p className="text-[14.5px] text-apple-secondary font-semibold">Không có thông báo nào</p>
          </div>
        ) : (
          displayNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`flex gap-4 px-6 py-4 cursor-pointer hover:bg-[#f5f5f7] transition-colors border-b border-[#f5f5f7] last:border-b-0 ${
                !notif.isRead ? 'bg-blue-50/40' : 'bg-white'
              }`}
            >
              <div className="relative flex-shrink-0 mt-0.5">
                <div className="w-12 h-12 rounded-full bg-[#f5f5f7] shadow-sm flex items-center justify-center">
                  {getIconForType(notif.type)}
                </div>
                {!notif.isRead && (
                  <span className="absolute -top-[2px] -right-[2px] w-3 h-3 bg-apple-blue rounded-full border-2 border-white" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-[15px] leading-snug ${!notif.isRead ? 'font-bold text-apple-dark' : 'font-semibold text-apple-dark'}`}>
                  {notif.title}
                </p>
                <p className="text-[14px] text-gray-700 font-medium line-clamp-2 mt-1.5 leading-relaxed break-words">
                  {notif.message}
                </p>
                <p className="text-[12.5px] text-gray-500 mt-2 font-bold tracking-tight">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#f5f5f7] shrink-0">
        <button
          onClick={() => {
            setIsOpen(false);
            navigate('/notifications');
          }}
          className="w-full text-center text-[15px] font-bold text-apple-blue hover:bg-[#f5f5f7] py-3 rounded-xl transition-colors"
        >
          Xem tất cả thông báo
        </button>
      </div>
    </>
  );

  return (
    <div className={isSidebar ? 'relative flex w-full justify-start' : 'relative flex'}>
      {/* Trigger — ref on wrapper so sidebar fixed panel anchors correctly */}
      <div ref={triggerRef} className="relative inline-flex">
        <button
          type="button"
          onClick={() => {
            if (window.innerWidth < 768) {
              navigate('/notifications');
            } else {
              setIsOpen((prev) => !prev);
            }
          }}
          className="hover:text-apple-blue transition-colors relative inline-flex items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Box cố định: badge neo tâm tại góc trên-phải (một phần tràn ra ngoài), không che thân chuông */}
          <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
            <Bell size={20} strokeWidth={1.5} className="pointer-events-none" aria-hidden />
            {unreadCount > 0 && (
              <span
                className="pointer-events-none absolute right-0 top-0 z-[1] inline-flex min-h-[17px] min-w-[17px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 px-[3px] py-px text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white tabular-nums"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Header shop: absolute, căn phải trigger */}
      {isOpen && !isSidebar && (
        <div
          ref={panelRef}
          className={`absolute right-0 top-full z-[110] mt-2 w-[400px] sm:w-[420px] ${panelSurface}`}
        >
          {panelInner}
        </div>
      )}

      {/* Admin sidebar: fixed + portal — không bị clip overflow, căn theo viewport */}
      {isOpen &&
        isSidebar &&
        sidebarPanelStyle &&
        createPortal(
          <div
            ref={panelRef}
            className={`fixed z-[250] ${panelSurface}`}
            style={{
              top: sidebarPanelStyle.top,
              left: sidebarPanelStyle.left,
              width: sidebarPanelStyle.width,
              maxHeight: sidebarPanelStyle.maxHeight,
            }}
          >
            {panelInner}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default NotificationDropdown;
