import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function ProductGallery({ images = [], productName = 'Hình ảnh sản phẩm' }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scrollRef = useRef(null);

  // Fallback no images
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-muted-foreground border">
        <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
        <span className="font-medium">Không có hình ảnh</span>
      </div>
    );
  }

  const getOptimizedImage = (url, width) => {
    if (!url) return '';
    if (url.includes('cloudinary.com') && !url.includes('upload/w_')) {
      return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
    }
    return url;
  };

  const selectedImage = getOptimizedImage(images[selectedIndex]?.url, 800);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    // adding width / 2 for smoother snap index detection
    const index = Math.round(scrollLeft / width);
    if (index !== selectedIndex && index >= 0 && index < images.length) {
      setSelectedIndex(index);
    }
  };

  const scrollToImage = (index) => {
    setSelectedIndex(index);
    if (scrollRef.current) {
      const width = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* ─── MOBILE CAROUSEL (< md) ─── */}
      <div className="md:hidden w-full relative -mx-4 px-4 w-[calc(100%+2rem)] max-w-[100vw]">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 hide-scrollbar scroll-smooth"
        >
          {images.map((img, index) => (
            <div 
              key={index} 
              className="w-full flex-shrink-0 snap-center bg-white border rounded-2xl overflow-hidden aspect-square flex items-center justify-center"
              onClick={() => setIsFullscreen(true)}
            >
              <img
                src={getOptimizedImage(img.url, 800)}
                alt={`${productName} - ${index + 1}`}
                className="w-full h-full object-contain p-4"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        
        {/* Dot Indicators */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollToImage(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === selectedIndex 
                    ? "w-5 h-1.5 bg-apple-blue" 
                    : "w-1.5 h-1.5 bg-[#d2d2d7]"
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── DESKTOP GALLERY (>= md) ─── */}
      <div className="hidden md:flex flex-col gap-4">
        {/* Ảnh chính */}
        <div
          className="w-full aspect-square bg-white border rounded-2xl overflow-hidden cursor-zoom-in relative group"
          onClick={() => setIsFullscreen(true)}
        >
          <img
            src={selectedImage}
            alt={productName}
            className="object-contain w-full h-full p-4 transition-transform duration-500 group-hover:scale-105"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </div>

        {/* Row Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
            {images.map((img, index) => (
              <button
                key={img.id || index}
                onClick={() => setSelectedIndex(index)}
                className={`relative flex-shrink-0 w-20 h-20 aspect-square rounded-xl overflow-hidden border-2 transition-all 
                  ${
                    index === selectedIndex
                      ? 'border-apple-blue shadow-md opacity-100 scale-100'
                      : 'border-transparent opacity-60 hover:opacity-100 scale-95 hover:scale-100'
                  }
                `}
              >
                <div className="absolute inset-0 bg-black/5" />
                <img
                  src={getOptimizedImage(img.url, 200)}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover bg-white"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox bằng Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full p-0 border-none bg-black/95 text-white flex items-center justify-center rounded-none shadow-none focus:outline-none focus-visible:outline-none">
          {/* Nút đóng góc phải */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Nút lùi */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Vùng hiển thị ảnh lớn */}
          <div className="w-full h-full p-8 flex items-center justify-center select-none">
            <img
              src={getOptimizedImage(images[selectedIndex]?.url, 1200)}
              alt={productName}
              className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-300"
            />
          </div>

          {/* Nút tiến */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-black/50 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Thông báo phân trang bottom */}
          {images.length > 1 && (
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full text-sm font-medium tracking-widest text-white/90">
               {selectedIndex + 1} / {images.length}
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
