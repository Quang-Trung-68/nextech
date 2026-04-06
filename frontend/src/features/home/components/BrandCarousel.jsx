import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { brandsCarouselQueryOptions } from '../home.queries';
import { cn } from '@/lib/utils';

const CATEGORY_SLUGS = ['phone', 'laptop', 'tablet', 'accessories'];

function internalCategoryPath(carouselCategorySlug) {
  return CATEGORY_SLUGS.includes(carouselCategorySlug) ? carouselCategorySlug : 'phone';
}

function hasValidLogoUrl(logo) {
  return typeof logo === 'string' && logo.trim().length > 0;
}

/** Một pill logo: ẩn hẳn nếu ảnh lỗi (URL hỏng). */
function BrandLogoPill({ b, ariaHidden, tabIndexOff }) {
  const [broken, setBroken] = useState(false);
  const cat = internalCategoryPath(b.carouselCategorySlug);
  const pillClass = cn(
    'flex h-16 min-w-[7rem] shrink-0 items-center justify-center rounded-full border border-[#e8e8ed] bg-[#f5f5f7] px-7 transition-transform hover:scale-105 hover:border-[#0071e3]/40 md:h-[4.5rem] md:min-w-[8rem] md:px-8'
  );
  const ti = tabIndexOff ? { tabIndex: -1 } : {};

  if (broken) return null;

  const inner = (
    <img
      src={b.logo}
      alt={ariaHidden ? '' : b.name}
      className="max-h-11 w-auto max-w-[min(200px,28vw)] object-contain md:max-h-12 md:max-w-[220px]"
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => setBroken(true)}
    />
  );

  if (b.websiteUrl) {
    return (
      <a
        href={b.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={pillClass}
        {...ti}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link
      to={`/${cat}?brand=${encodeURIComponent(b.slug)}`}
      className={pillClass}
      {...ti}
    >
      {inner}
    </Link>
  );
}

/** Một hàng logo; padding-right = gap để lặp translateX(-50%) khớp với nửa track (không giật). */
function BrandRow({ brands, rowKeyPrefix, ariaHidden, tabIndexOff }) {
  return (
    <div
      className={cn(
        'flex shrink-0 gap-6 pr-6 md:gap-10 md:pr-10',
        ariaHidden && 'pointer-events-none select-none'
      )}
      aria-hidden={ariaHidden ? true : undefined}
    >
      {brands.map((b, i) => (
        <BrandLogoPill
          key={`${rowKeyPrefix}-${b.id}-${i}`}
          b={b}
          ariaHidden={ariaHidden}
          tabIndexOff={tabIndexOff}
        />
      ))}
    </div>
  );
}

export function BrandCarousel() {
  const { data: rawBrands = [], isLoading } = useQuery(brandsCarouselQueryOptions());

  const brands = useMemo(
    () => rawBrands.filter((b) => hasValidLogoUrl(b.logo)),
    [rawBrands]
  );

  if (isLoading) {
    return (
      <section className="w-full bg-white py-10">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="h-16 w-full animate-pulse rounded-lg bg-muted md:h-[4.5rem]" />
        </div>
      </section>
    );
  }

  if (!brands.length) return null;

  return (
    <section className="w-full overflow-hidden bg-white py-10 md:py-14">
      <style>{`
        @keyframes brandMarquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        .brand-marquee-track {
          display: flex;
          width: max-content;
          animation: brandMarquee 55s linear infinite;
          will-change: transform;
          backface-visibility: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
          .brand-marquee-track {
            animation: none;
          }
        }
      `}</style>
      <h2 className="mb-6 text-center text-2xl font-bold text-[#1d1d1f] md:text-3xl">Thương hiệu</h2>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent md:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent md:w-24" />
        <div className="group overflow-hidden">
          <div
            className="brand-marquee-track"
            onMouseEnter={(e) => {
              e.currentTarget.style.animationPlayState = 'paused';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.animationPlayState = 'running';
            }}
          >
            <BrandRow brands={brands} rowKeyPrefix="m1" />
            <BrandRow brands={brands} rowKeyPrefix="m2" ariaHidden tabIndexOff />
          </div>
        </div>
      </div>
    </section>
  );
}
