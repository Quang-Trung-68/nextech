import { Fragment } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

export function ProductGrid({ data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage }) {
  console.log(data);
  // Biến loading chính cho lần fetch trang đầu tiên
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {data.pages.map((page, i) => (
          <Fragment key={i}>
            {page.products.map((product) => (
              <ProductCard key={product.id} product={product} />
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
  );
}
