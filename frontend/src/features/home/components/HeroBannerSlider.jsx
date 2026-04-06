import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { activeBannersQueryOptions } from '../home.queries';
import { cn } from '@/lib/utils';

const AUTO_MS = 5000;
const SWIPE_THRESHOLD = 50;

function BannerLink({ href, className, children, style }) {
  const external = /^https?:\/\//i.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className} style={style}>
      {children}
    </Link>
  );
}

export function HeroBannerSlider() {
  const { data: banners = [], isLoading, isError } = useQuery(activeBannersQueryOptions());
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState({});

  const containerRef = useRef(null);
  const [slideW, setSlideW] = useState(0);
  /** Vị trí trong dãy mở rộng: 0 = clone cuối, 1..n = thật, n+1 = clone đầu */
  const positionRef = useRef(1);
  const [position, setPosition] = useState(1);
  const [noTransition, setNoTransition] = useState(false);

  const intervalRef = useRef(null);
  const touchStartX = useRef(null);

  const n = banners.length;

  const extended = useMemo(() => {
    if (n <= 1) return banners;
    return [banners[n - 1], ...banners, banners[0]];
  }, [banners, n]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const measure = () => setSlideW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clearIntervalIfAny = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const snapAfterClone = useCallback(() => {
    const p = positionRef.current;
    if (n <= 1) return;
    if (p === n + 1) {
      setNoTransition(true);
      positionRef.current = 1;
      setPosition(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setNoTransition(false));
      });
    } else if (p === 0) {
      setNoTransition(true);
      positionRef.current = n;
      setPosition(n);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setNoTransition(false));
      });
    }
  }, [n]);

  const goNext = useCallback(() => {
    if (n <= 1) return;
    const p = positionRef.current;
    if (p === n + 1) return;
    const next = p + 1;
    positionRef.current = next;
    setPosition(next);
  }, [n]);

  const goPrev = useCallback(() => {
    if (n <= 1) return;
    const p = positionRef.current;
    if (p === 0) return;
    const next = p === 1 ? 0 : p - 1;
    positionRef.current = next;
    setPosition(next);
  }, [n]);

  const onTrackTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    snapAfterClone();
  };

  useEffect(() => {
    if (n <= 1 || paused) {
      clearIntervalIfAny();
      return undefined;
    }
    intervalRef.current = setInterval(() => {
      goNext();
    }, AUTO_MS);
    return () => clearIntervalIfAny();
  }, [n, paused, goNext]);

  const bannerIds = banners.map((b) => b.id).join(',');
  useEffect(() => {
    queueMicrotask(() => {
      if (n <= 1) {
        positionRef.current = 0;
        setPosition(0);
        return;
      }
      positionRef.current = 1;
      setPosition(1);
    });
  }, [n, bannerIds]);

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

  const translatePx = slideW > 0 && n > 1 ? -position * slideW : 0;
  const dotActive =
    n <= 1
      ? 0
      : position === 0
        ? n - 1
        : position === n + 1
          ? 0
          : position - 1;

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
        if (dx < -SWIPE_THRESHOLD) goNext();
        else if (dx > SWIPE_THRESHOLD) goPrev();
      }}
    >
      <div ref={containerRef} className="relative h-[240px] w-full overflow-hidden md:h-[400px]">
        <div
          className={cn(
            'flex h-full',
            !noTransition && 'transition-transform duration-500 ease-out'
          )}
          style={{
            transform: `translate3d(${translatePx}px, 0, 0)`,
            willChange: 'transform',
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {(n <= 1 ? banners : extended).map((b, i) => (
            <div key={`${i}-${b.id}`} className="h-full w-full min-w-full flex-shrink-0">
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
                    loading={i <= 1 ? 'eager' : 'lazy'}
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
                goPrev();
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
                goNext();
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
                    i === dotActive ? 'w-6 bg-[#0071e3]' : 'w-2 bg-black/25'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    if (n <= 1) return;
                    const target = i + 1;
                    positionRef.current = target;
                    setPosition(target);
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
