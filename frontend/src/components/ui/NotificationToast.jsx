import { useState } from 'react';
import { toast } from 'sonner';
import { Bell, ShoppingCart, CreditCard, Package, AlertTriangle } from 'lucide-react';

const DURATION = 5000;

const KEYFRAMES = `
  @keyframes shrinkNotificationBar {
    from { width: 100%; }
    to   { width: 0%;   }
  }
`;

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

function ToastContent({ notification, toastId, onNavigate }) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden w-[400px] sm:w-[420px] min-h-[72px] bg-white border border-[#d2d2d7] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 sm:p-5 cursor-pointer hover:bg-[#f5f5f7] transition-colors pointer-events-auto"
    >
      <style>{KEYFRAMES}</style>

      <div className="flex gap-4 pb-2 items-start">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-12 h-12 rounded-full bg-[#f5f5f7] flex items-center justify-center shadow-sm">
            {getIconForType(notification.type)}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-0 pt-0.5">
          <span className="font-bold text-[16px] text-apple-dark leading-snug">
            {notification.title}
          </span>
          {notification.message && (
            <span className="text-[14.5px] text-gray-700 font-medium leading-relaxed break-words">
              {notification.message}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-slate-100">
        <div
          className="h-full bg-apple-blue"
          style={{
            animation: `shrinkNotificationBar ${DURATION}ms linear forwards`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Show a notification toast with a progress bar that pauses on hover.
 * Clicking navigates to the target URL and dismisses the toast.
 */
export function showNotificationToast(notification, url, onNavigate) {
  toast.custom(
    (t) => (
      <ToastContent
        notification={notification}
        toastId={t}
        onNavigate={() => {
          toast.dismiss(t);
          onNavigate(url);
        }}
      />
    ),
    { duration: DURATION, position: 'bottom-right' }
  );
}
