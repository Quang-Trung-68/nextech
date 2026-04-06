import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { homePostsQueryOptions } from '../home.queries';
import { cn } from '@/lib/utils';

const AUTO_MS = 5000;

export function BlogCarousel() {
  const { data: posts = [], isLoading } = useQuery(homePostsQueryOptions());
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef(null);
  const intervalRef = useRef(null);

  const scrollStep = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;
    if (el.scrollLeft >= maxScroll - 4) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: Math.min(320, maxScroll - el.scrollLeft), behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!posts.length || paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return undefined;
    }
    intervalRef.current = setInterval(scrollStep, AUTO_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [posts.length, paused]);

  if (isLoading) {
    return (
      <section className="w-full bg-white py-12">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-6 flex gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 flex-1 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!posts.length) return null;

  return (
    <section
      className="w-full bg-white py-12 md:py-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold text-[#1d1d1f] md:text-3xl">Tin tức công nghệ</h2>

        <div className="relative">
          <button
            type="button"
            className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-black/10 bg-white p-2 shadow md:flex md:-left-2 lg:-left-4"
            aria-label="Trước"
            onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-black/10 bg-white p-2 shadow md:flex md:-right-4"
            aria-label="Sau"
            onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide snap-x snap-mandatory md:px-10"
          >
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} className="w-[85vw] shrink-0 snap-center sm:w-[300px] md:w-[calc(33.333%-11px)] md:min-w-[260px]" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogCard({ post, className }) {
  const dateStr =
    post.publishedAt &&
    (() => {
      try {
        return format(new Date(post.publishedAt), 'dd/MM/yyyy', { locale: vi });
      } catch {
        return '';
      }
    })();

  return (
    <Link
      to={`/news/${post.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-[#e8e8ed] bg-[#f5f5f7] transition hover:border-[#0071e3]/40',
        className
      )}
    >
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {post.category?.name ? (
          <span className="mb-2 inline-flex w-fit rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0071e3]">
            {post.category.name}
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1d1d1f] md:text-base">{post.title}</h3>
        {dateStr ? <p className="mt-2 text-xs text-muted-foreground">{dateStr}</p> : null}
      </div>
    </Link>
  );
}
