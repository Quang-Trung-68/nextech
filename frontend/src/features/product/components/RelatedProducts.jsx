import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRelatedProducts } from '@/features/product/hooks/useProduct';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

const CARD_SCROLL_PX = 220;

/**
 * @param {{ productId: string }} props
 */
export function RelatedProducts({ productId }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data: products = [], isLoading, isError } = useRelatedProducts(productId);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const epsilon = 2;
    setCanScrollLeft(scrollLeft > epsilon);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - epsilon);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    return () => ro.disconnect();
  }, [products, updateScrollState]);

  const scrollPrev = () => {
    scrollRef.current?.scrollBy({ left: -CARD_SCROLL_PX, behavior: 'smooth' });
  };

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: CARD_SCROLL_PX, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Sản phẩm liên quan</h2>
        <div className="flex gap-4 overflow-hidden pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[220px]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError || !products.length) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">Sản phẩm liên quan</h2>
      <div className="relative group">
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canScrollLeft}
          aria-label="Xem trước"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          role="region"
          aria-label="Danh sách sản phẩm liên quan"
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pb-2"
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[220px]">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollNext}
          disabled={!canScrollRight}
          aria-label="Xem tiếp"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
