import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Headphones, X, MessageSquare, Phone, MessageCircle } from 'lucide-react';

const SubButton = ({ icon, tooltip, label, href, bgColor, delay, onClick, isOpen }) => {
  const isLink = !!href;
  const baseClasses = `relative flex h-11 w-11 items-center justify-center rounded-full shadow-md transition-all duration-200 ease-out group ${bgColor} ${
    isOpen ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto' : 'scale-95 opacity-0 translate-y-2 pointer-events-none'
  }`;
  const style = { transitionDelay: `${delay}ms` };

  const content = (
    <>
      {icon}
      <span className="absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hidden md:block pointer-events-none">
        {tooltip}
        <div className="absolute -right-1 top-1/2 mt-[-4px] h-0 w-0 border-y-4 border-l-[5px] border-y-transparent border-l-gray-800"></div>
      </span>
    </>
  );

  if (isLink) {
    return (
      <a
        href={href}
        target={href.startsWith('tel:') ? '_self' : '_blank'}
        rel={href.startsWith('tel:') ? '' : 'noopener noreferrer'}
        aria-label={label}
        className={baseClasses}
        style={style}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} aria-label={label} className={baseClasses} style={style}>
      {content}
    </button>
  );
};

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(() => !sessionStorage.getItem('support_hint_shown'));
  const widgetRef = useRef(null);
  const location = useLocation();
  
  const onProductRoot =
    ['/phone', '/laptop', '/tablet', '/accessories'].some(
      (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
    );
  const hasBottomNav =
    typeof window !== 'undefined' &&
    window.innerWidth < 768 &&
    (location.pathname === '/' || onProductRoot || location.pathname.startsWith('/profile'));
  
  const bottomOffsetClass = hasBottomNav 
    ? "bottom-[calc(80px+env(safe-area-inset-bottom))]" 
    : "bottom-[calc(20px+env(safe-area-inset-bottom))] md:bottom-5";

  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(() => {
      setShowHint(false);
      sessionStorage.setItem('support_hint_shown', '1');
    }, 4000);
    return () => clearTimeout(timer);
  }, [showHint]);

  useEffect(() => {
    // Close on outside click (mobile)
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent('support-widget-state', { detail: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]); // Added isOpen to deps to avoid stale state issues, though setIsOpen is stable

  const dismissHint = () => {
    if (showHint) {
      setShowHint(false);
      sessionStorage.setItem('support_hint_shown', '1');
    }
  };

  const handleClickMain = () => {
    dismissHint();
    const newState = !isOpen;
    setIsOpen(newState);
    window.dispatchEvent(new CustomEvent('support-widget-state', { detail: newState }));
  };

  const dispatchLiveChat = () => {
    window.dispatchEvent(new CustomEvent('open-live-chat'));
  };

  return (
    <div
      ref={widgetRef}
      className={`fixed right-5 z-50 flex flex-col items-center gap-3 pointer-events-none transition-all duration-300 ${bottomOffsetClass}`}
      role="complementary"
      aria-label="Hỗ trợ khách hàng"
    >
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <SubButton
          isOpen={isOpen}
          icon={<Phone className="text-white" size={20} />}
          tooltip="Gọi hotline: 1800 xxxx"
          label="Gọi hotline: 1800 xxxx"
          href="tel:1800xxxx" // TODO: replace with real phone number
          bgColor="bg-orange-500"
          delay={150}
          onClick={() => {
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent('support-widget-state', { detail: false }));
          }}
        />
        <SubButton
          isOpen={isOpen}
          icon={<MessageSquare className="text-white" size={20} />}
          tooltip="Chat với tư vấn viên"
          label="Chat với tư vấn viên"
          bgColor="bg-green-500"
          delay={100}
          onClick={() => {
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent('support-widget-state', { detail: false }));
            dispatchLiveChat();
          }}
        />
        <SubButton
          isOpen={isOpen}
          icon={<MessageCircle className="text-white" size={20} fill="currentColor" />}
          tooltip="Chat qua Messenger"
          label="Chat qua Messenger"
          href="https://m.me/nextech.vn" // TODO: replace with real Messenger URL
          bgColor="bg-[#0084FF]"
          delay={50}
          onClick={() => {
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent('support-widget-state', { detail: false }));
          }}
        />
        <SubButton
          isOpen={isOpen}
          icon={<span className="font-bold text-white text-xl leading-none font-sans">Z</span>}
          tooltip="Liên hệ qua Zalo"
          label="Liên hệ qua Zalo"
          href="https://zalo.me/0123456789" // TODO: replace with real Zalo URL
          bgColor="bg-[#0068FF]"
          delay={0}
          onClick={() => {
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent('support-widget-state', { detail: false }));
          }}
        />
      </div>

      <div className="relative pointer-events-auto">
        {/* Tooltip hint */}
        {showHint && (
          <div className="absolute right-16 bottom-1 flex items-center transition-opacity duration-300 pointer-events-none">
            <div className="whitespace-nowrap rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-xl">
              Cần hỗ trợ? 💬
            </div>
            {/* Callout triangle */}
            <div className="ml-0 h-0 w-0 border-y-[6px] border-l-[8px] border-y-transparent border-l-gray-900 mt-2"></div>
          </div>
        )}

        {/* Pulse ring when hint is visible */}
        {showHint && (
          <div className="absolute inset-0 rounded-full ring-4 ring-blue-400/40 animate-pulse pointer-events-none"></div>
        )}

        {/* Main Button */}
        <button
          onClick={handleClickMain}
          aria-label={isOpen ? 'Đóng hỗ trợ' : 'Mở hỗ trợ'}
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 text-white transition-all duration-200 hover:scale-105 ${
            !isOpen && !showHint ? 'support-btn-pulse' : ''
          }`}
        >
          <div className="relative flex items-center justify-center w-full h-full">
            <div className={`absolute transition-all duration-300 ease-in-out ${isOpen ? 'scale-0 opacity-0 rotate-[-90deg]' : 'scale-100 opacity-100 rotate-0'}`}>
              <div className={!isOpen ? 'animate-headphone-shake' : ''}>
                <Headphones size={24} strokeWidth={2.5} />
              </div>
            </div>
            <X className={`absolute transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-90deg'}`} size={24} strokeWidth={2.5} />
          </div>
        </button>
      </div>
    </div>
  );
}
