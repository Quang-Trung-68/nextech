import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { homeBrandProductsQueryOptions, topBrandsQueryOptions } from '../home.queries';
import { getSlugByCategory } from '@/constants/category';
import { formatVND } from '@/utils/price';
import { Badge } from '@/components/ui/badge';
import SaleCountdownBadge from '@/components/product/SaleCountdownBadge';

function ProductCard({ product }) {
  const img = product.images?.[0]?.url;
  const typeSeg = getSlugByCategory(product.category);
  const to = `/${typeSeg}/${product.slug}`;

  return (
    <Link
      to={to}
      className="group flex min-w-[140px] max-w-[180px] flex-col overflow-hidden rounded-2xl border border-[#e8e8ed] bg-white shadow-sm transition hover:border-[#0071e3]/30 sm:min-w-[160px]"
    >
      <div className="relative aspect-square bg-[#f5f5f7]">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
        ) : null}
        {product.isNewArrival ? (
          <Badge className="absolute left-2 top-2 bg-[#0071e3] text-[10px] font-semibold">Mới</Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-[#1d1d1f] md:text-sm">{product.name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-sm font-semibold text-[#1d1d1f]">{formatVND(product.finalPrice ?? product.price)}</span>
          {product.discountPercent > 0 ? (
            <span className="text-xs text-muted-foreground line-through">{formatVND(product.price)}</span>
          ) : null}
        </div>
        <div className="mt-1 min-h-[24px]">
          <SaleCountdownBadge saleExpiresAt={product.saleExpiresAt} isSaleActive={product.isSaleActive} />
        </div>
      </div>
    </Link>
  );
}

export function NewestByBrand() {
  const { data: topBrands = [], isLoading: loadingBrands } = useQuery(topBrandsQueryOptions(4));

  const productQueries = useQueries({
    queries: topBrands.map((b) => ({
      ...homeBrandProductsQueryOptions(b.slug, 6),
    })),
  });

  if (loadingBrands) {
    return (
      <section className="w-full bg-[#f5f5f7] py-12">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-6 flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 w-40 shrink-0 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const rows = topBrands
    .map((brand, i) => ({
      brand,
      products: productQueries[i]?.data ?? [],
      isLoading: productQueries[i]?.isLoading,
    }))
    .filter((row) => row.products.length > 0);

  if (!rows.length) return null;

  return (
    <section className="w-full bg-[#f5f5f7] py-12 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {rows.map(({ brand, products, isLoading }) => (
          <div key={brand.id} className="mb-12 last:mb-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-[#1d1d1f] md:text-2xl">Mới nhất từ {brand.name}</h2>
              <Link
                to={`/phone?brand=${encodeURIComponent(brand.slug)}`}
                className="inline-flex items-center text-sm font-medium text-[#0071e3] hover:underline"
              >
                Xem tất cả
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {isLoading ? (
              <div className="flex gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 w-40 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 md:gap-4 md:overflow-visible">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
