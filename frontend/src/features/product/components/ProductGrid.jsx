import { Fragment, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/features/product/components/ProductCard';
import { ProductCardSkeleton } from '@/features/product/components/ProductCardSkeleton';
import { useMyFavorites } from '@/features/favorites';

export function ProductGrid({ data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage }) {
  const { data: favorites = [] } = useMyFavorites();
  const favoritedIds = useMemo(
    () => new Set(favorites.map((p) => p.id)),
    [favorites]
  );
  // Biến loading chính cho lần fetch trang đầu tiên
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <ProductCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Kết thúc fetch lần đầu nhưng không có data 
  if (!data?.pages || data?.pages[0]?.products?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-slate-50 dark:bg-slate-900 border-dashed">
        <p className="text-xl font-medium text-foreground">Không tìm thấy sản phẩm</p>
        <p className="text-muted-foreground mt-2">Vui lòng thử tìm kiếm với các bộ lọc khác.</p>
      </div>
    );
  }

  return (
    <section className="bg-[#F5F5F7] py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h2 className="text-3xl md:text-4xl tracking-tight mb-8">
          <span className="font-semibold text-black">Accessories.</span>{' '}
          <span className="font-normal text-[#6E6E73]">Essentials that pair perfectly.</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {data.pages.map((page, i) => (
          <Fragment key={i}>
            {page.products.map((product) => (
              <ProductCard
                key={product.id}
                product={{ ...product, isFavorited: favoritedIds.has(product.id) }}
              />
            ))}
          </Fragment>
        ))}
      </div>

      {hasNextPage && (
        <div className="text-center pt-8">
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-8 font-medium bg-background text-foreground shadow-sm hover:shadow"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải...
              </>
            ) : (
              'Xem thêm kết quả'
            )}
          </Button>
        </div>
      )}

      {!hasNextPage && (
        <div className="text-center pt-8 text-sm text-muted-foreground font-medium">
          Tất cả sản phẩm đã được hiển thị
        </div>
      )}
      </div>
    </section>
  );
}
