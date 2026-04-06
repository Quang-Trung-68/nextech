import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { activeBannersQueryOptions } from '../home.queries';
import { cn } from '@/lib/utils';

const AUTO_MS = 4500;
const SWIPE_THRESHOLD = 50;

function BannerLink({ href, className, children }) {
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export function HeroBannerSlider() {
  const { data: banners = [], isLoading, isError } = useQuery(activeBannersQueryOptions());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState({});
  const intervalRef = useRef(null);
  const touchStartX = useRef(null);

  const n = banners.length;

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const go = (dir) => {
    if (n <= 0) return;
    setIndex((i) => (dir === 'next' ? (i + 1) % n : (i - 1 + n) % n));
  };

  useEffect(() => {
    if (n <= 1 || paused) {
      clear();
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, AUTO_MS);
    return () => clear();
  }, [n, paused]);

  if (isError) {
    return (
      <section className="w-full bg-white py-8 text-center text-sm text-muted-foreground">
        Không tải được banner. Vui lòng thử lại sau.
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="w-full bg-[#f5f5f7]">
        <div className="h-[240px] w-full animate-pulse md:h-[400px]" />
      </section>
    );
  }

  if (!banners.length) return null;

  return (
    <section
      key={banners.map((b) => b.id).join('-')}
      className="relative w-full overflow-hidden bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start == null) return;
        const end = e.changedTouches[0]?.clientX ?? start;
        const dx = end - start;
        if (dx < -SWIPE_THRESHOLD) go('next');
        else if (dx > SWIPE_THRESHOLD) go('prev');
      }}
    >
      <div className="relative h-[240px] w-full overflow-hidden md:h-[400px]">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((b) => (
            <div key={b.id} className="h-full min-w-full flex-shrink-0">
              <BannerLink
                href={b.linkUrl}
                className="relative flex h-full w-full flex-col md:flex-row"
                style={{ backgroundColor: b.bgColor }}
              >
                <div className="relative z-10 flex flex-1 flex-col justify-center px-4 py-6 text-center md:px-12 md:text-left">
                  <h2 className="text-2xl font-bold tracking-tight md:text-4xl" style={{ color: b.textColor }}>
                    {b.title}
                  </h2>
                  {b.subtitle ? (
                    <p className="mt-2 text-sm opacity-90 md:text-lg" style={{ color: b.textColor }}>
                      {b.subtitle}
                    </p>
                  ) : null}
                </div>
                <div className="relative h-[45%] min-h-[120px] flex-1 md:h-full md:min-h-0">
                  <img
                    src={b.imageUrl}
                    alt=""
                    loading="lazy"
                    className={cn(
                      'h-full w-full object-cover transition-opacity duration-500',
                      loaded[b.id] ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setLoaded((prev) => ({ ...prev, [b.id]: true }))}
                  />
                </div>
              </BannerLink>
            </div>
          ))}
        </div>

        {n > 1 ? (
          <>
            <button
              type="button"
              aria-label="Slide trước"
              className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-black/10 bg-white/90 p-2 shadow md:flex"
              onClick={(e) => {
                e.preventDefault();
                go('prev');
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Slide sau"
              className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-black/10 bg-white/90 p-2 shadow md:flex"
              onClick={(e) => {
                e.preventDefault();
                go('next');
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === index ? 'w-6 bg-[#0071e3]' : 'w-2 bg-black/25'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setIndex(i);
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
