import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { axiosPublic } from '@/lib/axios';
import { newsCategoriesQueryOptions } from '@/features/news/api';
import { ArticleCard } from '@/features/news/components/ArticleCard';
import { NewsCategorySidebar } from '@/features/news/components/NewsCategorySidebar';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import usePageTitle from '@/hooks/usePageTitle';

const LIMIT = 10;

export default function NewsPage() {
  usePageTitle('Tin tức | NexTech');
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const searchFromUrl = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(searchFromUrl);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === searchFromUrl) return;
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (searchInput.trim()) p.set('search', searchInput.trim());
          else p.delete('search');
          return p;
        },
        { replace: true },
      );
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, searchFromUrl, setSearchParams]);

  const filterKey = useMemo(
    () => ({ category, tag, search: searchFromUrl }),
    [category, tag, searchFromUrl],
  );

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['news', 'list', 'infinite', filterKey],
    queryFn: async ({ pageParam }) => {
      const { data: res } = await axiosPublic.get('/posts', {
        params: {
          page: pageParam,
          limit: LIMIT,
          ...(category ? { category } : {}),
          ...(tag ? { tag } : {}),
          ...(searchFromUrl ? { search: searchFromUrl } : {}),
        },
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const { page, limit, total } = lastPage;
      const loaded = page * limit;
      if (loaded >= total) return undefined;
      return page + 1;
    },
  });

  const { data: categories = [], isLoading: catLoading } = useQuery(newsCategoriesQueryOptions());

  const items = useMemo(
    () => data?.pages.flatMap((p) => p.data ?? []) ?? [],
    [data?.pages],
  );

  const setCategory = useCallback(
    (slug) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (slug) p.set('category', slug);
          else p.delete('category');
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '240px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const endMessage = useMemo(() => {
    if (hasNextPage || items.length === 0) return null;
    if (category) {
      return 'Đã hết bài viết cùng danh mục.';
    }
    if (tag) {
      return 'Đã hết bài viết cùng tag.';
    }
    return 'Đã hiển thị tất cả bài viết.';
  }, [hasNextPage, items.length, category, tag]);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-foreground mb-6">Tin tức</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <NewsCategorySidebar
          categories={categories}
          categorySlug={category}
          onSelectCategory={setCategory}
          isLoading={catLoading}
        />

        <div className="flex-1 min-w-0 lg:w-[75%]">
          <div className="relative mb-6">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc mô tả..."
              className="pl-10 h-11"
            />
          </div>

          {isLoading && (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-apple-blue" size={32} />
            </div>
          )}

          {isError && (
            <p className="text-center text-destructive py-8">
              Không tải được danh sách tin. Thử lại sau.
            </p>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Chưa có bài viết nào.</p>
          )}

          <div className="flex flex-col gap-4">
            {items.map((post) => (
              <ArticleCard key={`${post.id}-${post.slug}`} post={post} />
            ))}
          </div>

          {!isLoading && hasNextPage && (
            <div ref={sentinelRef} className="h-8 flex justify-center items-center py-6">
              {isFetchingNextPage && <Loader2 className="animate-spin text-apple-blue" size={24} />}
            </div>
          )}

          {!isLoading && !hasNextPage && endMessage && (
            <p className="text-center text-sm text-muted-foreground py-8">{endMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
