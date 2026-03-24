import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import StarRating from './StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

const LIMIT = 10;

// ─── Avatar với initials fallback ────────────────────────────────────────────
const UserAvatar = ({ name = '', avatarUrl }) => {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
      />
    );
  }

  return (
    <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0 select-none">
      {initials || '?'}
    </span>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const ReviewSkeleton = () => (
  <div className="flex gap-4 py-5 border-b border-gray-100 last:border-0 animate-pulse">
    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

// ─── Rating Distribution Bar ──────────────────────────────────────────────────
const DistributionBar = ({ label, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-5 text-right text-apple-secondary font-medium shrink-0">
        {label}
      </span>
      <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="#f59e0b"
        />
      </svg>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-apple-secondary text-xs shrink-0">{count}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * ProductReviews
 *
 * Props:
 *   productId — string (bắt buộc), truyền từ parent page
 */
const ProductReviews = ({ productId }) => {
  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await axiosInstance.get(`/products/${productId}/reviews`, {
        params: { page: pageParam, limit: LIMIT },
      });
      return data; // { success, reviews, pagination, summary }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination ?? {};
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!productId,
  });

  // Flatten all pages
  const allReviews = data?.pages.flatMap((p) => p.reviews) ?? [];
  const summary = data?.pages[0]?.summary ?? null;

  return (
    <section aria-label="Đánh giá sản phẩm">

      {/* ─── Section Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-apple-dark tracking-tight">
          Đánh giá sản phẩm
        </h2>
        {summary && (
          <p className="text-apple-secondary text-sm mt-1">
            {summary.totalReviews > 0
              ? `${summary.totalReviews} đánh giá`
              : 'Chưa có đánh giá nào'}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-10">

        {/* ─── Left: Rating Summary ──────────────────────────────────────── */}
        <div className="md:w-64 shrink-0 flex flex-col items-center md:items-start gap-5">
          {isLoading ? (
            <div className="space-y-3 w-full">
              <Skeleton className="h-14 w-24" />
              <Skeleton className="h-5 w-32" />
              <div className="space-y-2 w-full">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ) : summary ? (
            <>
              {/* Average rating number */}
              <div className="flex flex-col items-center md:items-start">
                <span className="text-5xl font-black text-apple-dark leading-none">
                  {summary.averageRating !== null
                    ? summary.averageRating.toFixed(1)
                    : '—'}
                </span>
                <span className="text-sm text-apple-secondary mt-1">trên 5</span>
              </div>

              {/* Stars visual */}
              <StarRating rating={summary.averageRating ?? 0} size={24} />

              {/* Tổng số đánh giá */}
              <p className="text-sm text-apple-secondary">
                {summary.totalReviews} đánh giá
              </p>

              {/* Distribution bars 5 → 1 */}
              <div className="w-full space-y-2 mt-2">
                {[5, 4, 3, 2, 1].map((star) => (
                  <DistributionBar
                    key={star}
                    label={star}
                    count={summary.ratingDistribution?.[star] ?? 0}
                    total={summary.totalReviews}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* ─── Right: Reviews list ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Loading skeletons */}
          {isLoading && (
            <div>
              {[1, 2, 3].map((i) => (
                <ReviewSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="py-8 text-center text-red-500 text-sm">
              Không thể tải đánh giá. Vui lòng thử lại sau.
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && allReviews.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <MessageSquare className="w-12 h-12 text-gray-200" />
              <p className="text-apple-secondary font-medium">
                Chưa có đánh giá nào.
              </p>
              <p className="text-sm text-gray-400">
                Hãy là người đầu tiên chia sẻ trải nghiệm!
              </p>
            </div>
          )}

          {/* Review cards */}
          {allReviews.length > 0 && (
            <div className="divide-y divide-gray-100">
              {allReviews.map((review) => (
                <article
                  key={review.id}
                  className="py-5 flex gap-4 group"
                  aria-label={`Đánh giá của ${review.user?.name}`}
                >
                  <UserAvatar
                    name={review.user?.name ?? ''}
                    avatarUrl={review.user?.avatar}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mb-1">
                      <span className="font-semibold text-apple-dark text-sm">
                        {review.user?.name ?? 'Người dùng'}
                      </span>
                      <span className="text-xs text-apple-secondary">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="mb-2">
                      <StarRating rating={review.rating} size={14} />
                    </div>

                    {review.comment && (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                className="rounded-full px-8 font-medium border-gray-200"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm đánh giá'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
