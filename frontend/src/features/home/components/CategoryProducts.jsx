import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { homeCategoryProductsQueryOptions } from '../home.queries';
import { SLUG_LABEL_MAP, getSlugByCategory } from '@/constants/category';
import { formatVND } from '@/utils/price';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SaleCountdownBadge from '@/components/product/SaleCountdownBadge';

const TABS = [
  { key: 'phone', path: '/phone', label: SLUG_LABEL_MAP.phone },
  { key: 'laptop', path: '/laptop', label: SLUG_LABEL_MAP.laptop },
  { key: 'tablet', path: '/tablet', label: SLUG_LABEL_MAP.tablet },
  { key: 'accessories', path: '/accessories', label: SLUG_LABEL_MAP.accessories },
];

function ProductCard({ product }) {
  const img = product.images?.[0]?.url;
  const typeSeg = getSlugByCategory(product.category);
  const to = `/${typeSeg}/${product.slug}`;

  return (
    <Link
      to={to}
      className="group flex flex-col overflow-hidden rounded-xl border border-[#e8e8ed] bg-white shadow-sm transition hover:border-[#0071e3]/30"
    >
      <div className="relative aspect-square bg-[#f5f5f7]">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
        ) : null}
        {product.isNewArrival ? (
          <Badge className="absolute left-1.5 top-1.5 bg-[#0071e3] text-[9px] font-semibold px-1.5 py-0">Mới</Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-2 sm:p-2.5">
        <p className="line-clamp-2 min-h-[2.25rem] text-[11px] font-medium leading-snug text-[#1d1d1f] sm:min-h-[2.5rem] sm:text-xs">
          {product.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="text-xs font-semibold text-[#1d1d1f] sm:text-sm">{formatVND(product.finalPrice ?? product.price)}</span>
          {product.discountPercent > 0 ? (
            <span className="text-[10px] text-muted-foreground line-through sm:text-xs">{formatVND(product.price)}</span>
          ) : null}
        </div>
        <div className="mt-0.5 min-h-[20px] sm:min-h-[24px]">
          <SaleCountdownBadge saleExpiresAt={product.saleExpiresAt} isSaleActive={product.isSaleActive} />
        </div>
      </div>
    </Link>
  );
}

export function CategoryProducts() {
  const [tab, setTab] = useState(TABS[0].key);
  const { data: products = [], isLoading, isFetching } = useQuery(homeCategoryProductsQueryOptions(tab, 12));

  return (
    <section className="w-full bg-white py-12 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-center text-2xl font-bold text-[#1d1d1f] md:text-3xl">Sản phẩm theo danh mục</h2>

        <div className="mb-6 flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:py-1.5 sm:text-sm',
                tab === t.key
                  ? 'border-[#0071e3] bg-[#0071e3] text-white'
                  : 'border-[#e8e8ed] bg-[#f5f5f7] text-[#1d1d1f] hover:border-[#0071e3]/50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          key={tab}
          className={cn(
            'transition-opacity duration-300',
            isFetching && !isLoading ? 'opacity-70' : 'opacity-100'
          )}
        >
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Chưa có sản phẩm trong danh mục này.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  to={TABS.find((x) => x.key === tab)?.path ?? '/phone'}
                  className="inline-flex items-center rounded-full border border-[#0071e3] px-6 py-2 text-sm font-semibold text-[#0071e3] hover:bg-[#0071e3]/5"
                >
                  Xem thêm
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
