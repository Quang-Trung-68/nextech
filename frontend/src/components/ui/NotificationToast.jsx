import { useState } from 'react';
import { toast } from 'sonner';

const DURATION = 5000;

const KEYFRAMES = `
  @keyframes shrinkNotificationBar {
    from { width: 100%; }
    to   { width: 0%;   }
  }
`;

function ToastContent({ notification, toastId, onNavigate }) {
  const [paused, setPaused] = useState(false);

  return (
    <div
      onClick={onNavigate}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden w-[356px] min-h-[64px] bg-white border border-[#d2d2d7] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 cursor-pointer hover:bg-[#f5f5f7] transition-colors pointer-events-auto"
    >
      <style>{KEYFRAMES}</style>

      <div className="flex flex-col gap-1 pb-2">
        <span className="font-semibold text-[14px] text-apple-dark leading-snug">
          {notification.title}
        </span>
        {notification.message && (
          <span className="text-[13px] text-apple-secondary leading-snug break-words">
            {notification.message}
          </span>
        )}
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
