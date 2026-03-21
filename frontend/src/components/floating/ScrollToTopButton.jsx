import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

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
      } ${isWidgetOpen ? 'bottom-[300px]' : 'bottom-28 md:bottom-24'}`}
    >
      <ArrowUp size={24} strokeWidth={2.5} className="text-gray-700" />
    </button>
  );
}
