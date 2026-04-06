import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { brandsCarouselQueryOptions } from '../home.queries';
import { cn } from '@/lib/utils';

export function BrandCarousel() {
  const { data: brands = [], isLoading } = useQuery(brandsCarouselQueryOptions());

  if (isLoading) {
    return (
      <section className="w-full bg-white py-10">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="h-14 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      </section>
    );
  }

  if (!brands.length) return null;

  const track = [...brands, ...brands];

  return (
    <section className="w-full overflow-hidden bg-white py-10 md:py-14">
      <style>{`
        @keyframes brandMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <h2 className="mb-6 text-center text-2xl font-bold text-[#1d1d1f] md:text-3xl">Thương hiệu</h2>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent md:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent md:w-24" />
        <div className="group overflow-hidden">
          <div
            className="flex w-max gap-6 md:gap-10"
            style={{
              animation: 'brandMarquee 38s linear infinite',
              animationPlayState: 'running',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.animationPlayState = 'paused';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.animationPlayState = 'running';
            }}
          >
            {track.map((b, i) => (
              <Link
                key={`${b.id}-${i}`}
                to={`/phone?brand=${encodeURIComponent(b.slug)}`}
                className={cn(
                  'flex h-14 shrink-0 items-center justify-center rounded-full border border-[#e8e8ed] bg-[#f5f5f7] px-6 transition-transform hover:scale-105 hover:border-[#0071e3]/40'
                )}
              >
                {b.logo ? (
                  <img src={b.logo} alt={b.name} className="max-h-8 max-w-[120px] object-contain" loading="lazy" />
                ) : (
                  <span className="whitespace-nowrap text-sm font-semibold text-[#1d1d1f]">{b.name}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
