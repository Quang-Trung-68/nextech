import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const location = useLocation();

  const hasBottomNav = typeof window !== 'undefined' && window.innerWidth < 768 && 
    (location.pathname === '/' || location.pathname === '/products' || location.pathname.startsWith('/profile'));

  const bottomClass = isWidgetOpen 
    ? (hasBottomNav ? 'bottom-[calc(300px+56px+env(safe-area-inset-bottom))]' : 'bottom-[300px]')
    : (hasBottomNav ? 'bottom-[calc(136px+env(safe-area-inset-bottom))]' : 'bottom-[76px]');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    const handleWidgetState = (e) => {
      setIsWidgetOpen(e.detail);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('support-widget-state', handleWidgetState);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('support-widget-state', handleWidgetState);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Lên đầu trang"
      className={`fixed right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-all duration-300 ease-out hover:scale-110 hover:bg-gray-50 hover:shadow-xl ${
        isVisible ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none translate-x-4 opacity-0'
      } ${bottomClass}`}
    >
      <ArrowUp size={24} strokeWidth={2.5} className="text-gray-700" />
    </button>
  );
}
