import React, { useState, useMemo } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Link, useSearchParams, useParams, useNavigate, Navigate } from 'react-router-dom';
import { SLUG_MAP, SLUG_LABEL_MAP, getSlugByCategory } from '@/constants/category';
import { Grid, List, SlidersHorizontal, ChevronRight, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddToCart } from '@/features/cart/hooks/useCartMutations';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { formatVND } from '@/utils/price';
import { useMyFavorites, FavoriteButton } from '@/features/favorites';
import FilterDrawer from './FilterDrawer';
import SaleCountdownBadge from '@/components/product/SaleCountdownBadge';
import SaleStockBadge from '@/components/product/SaleStockBadge';

const HIGHLIGHTS = [
  { id: 'new-arrival', label: 'Hàng mới về' },
  { id: 'on-sale', label: 'Đang giảm giá' },
  { id: 'bestseller', label: 'Bán chạy' },
  { id: 'top-rated', label: 'Được đánh giá cao' }
];

const PRICE_RANGES = [
  { id: 'under-5', label: 'Dưới 5tr', min: 0, max: 4999999 },
  { id: '5-15', label: '5 – 15tr', min: 5000000, max: 15000000 },
  { id: '15-30', label: '15 – 30tr', min: 15000000, max: 30000000 },
  { id: 'over-30', label: 'Trên 30tr', min: 30000000, max: 999999999 }
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();

  const highlightParam = searchParams.get('highlight');
  const highlights = highlightParam ? highlightParam.split(',') : [];

  const pageLabel = categorySlug ? SLUG_LABEL_MAP[categorySlug] : null;
  usePageTitle(pageLabel || 'Sản phẩm'); // → "Điện thoại | NexTech" or "Sản phẩm | NexTech"
  const [priceRanges, setPriceRanges] = useState([]);
  const [sort, setSort] = useState('Mới nhất'); // Nổi bật, Mới nhất, Giá tăng dần, Giá giảm dần
  const [viewMode, setViewMode] = useState('grid');
  const limit = 12;

  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();
  
  // Custom Add To Cart handler
  const handleAddToCart = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return navigate('/login', { state: { from: location.pathname + location.search } });
    }

    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          toast.success('Đã thêm sản phẩm vào giỏ hàng!');
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng');
        }
      }
    );
  };

  // Custom Buy Now handler
  const handleBuyNow = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      return navigate('/login', { state: { from: location.pathname + location.search } });
    }

    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          navigate('/checkout');
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi mua hàng');
        }
      }
    );
  };

  // Build Query Params
  const getQueryParams = (pageParam) => {
    let sortParam = 'newest';
    if (sort === 'Giá tăng dần') sortParam = 'price_asc';
    if (sort === 'Giá giảm dần') sortParam = 'price_desc';

    const params = { page: pageParam, limit, sort: sortParam };
    if (categorySlug && SLUG_MAP[categorySlug]) params.category = SLUG_MAP[categorySlug];
    if (highlightParam) params.highlight = highlightParam;
    
    // Find absolute min and max prices from selected ranges
    if (priceRanges.length > 0) {
      const selectedRanges = PRICE_RANGES.filter(r => priceRanges.includes(r.id));
      params.minPrice = Math.min(...selectedRanges.map(r => r.min));
      params.maxPrice = Math.max(...selectedRanges.map(r => r.max));
    }
    return params;
  };

  // Fetch Data
  const { 
    data, 
    isLoading, 
    isError, 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['products', categorySlug, highlightParam, priceRanges, sort],
    queryFn: async ({ pageParam }) => {
      const res = await axiosInstance.get('/products', { params: getQueryParams(pageParam) });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  const products = data ? data.pages.flatMap(page => page.products || []) : [];
  const totalItems = data?.pages?.[0]?.totalCount || 0;

  // Favorites
  const { data: favorites = [] } = useMyFavorites();
  const favoritedIds = useMemo(
    () => new Set(favorites.map((p) => p.id)),
    [favorites]
  );

  // Handlers
  const handleHighlightChange = (highlightId) => {
    let newHighlights = [...highlights];
    if (newHighlights.includes(highlightId)) {
      newHighlights = newHighlights.filter(h => h !== highlightId);
    } else {
      newHighlights.push(highlightId);
    }
    
    if (newHighlights.length > 0) {
      searchParams.set('highlight', newHighlights.join(','));
    } else {
      searchParams.delete('highlight');
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handlePriceChange = (priceId) => {
    setPriceRanges(prev => prev.includes(priceId) ? prev.filter(p => p !== priceId) : [...prev, priceId]);
  };

  const clearFilters = () => {
    setPriceRanges([]);
    searchParams.delete('highlight');
    setSearchParams(searchParams, { replace: true });
  };

  // Redirect if invalid slug
  if (categorySlug && !SLUG_MAP[categorySlug]) {
    return <Navigate to="/products" replace />;
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col gap-8 w-full">
      {/* Đặc điểm nổi bật */}
      <div>
        <h4 className="font-semibold text-apple-dark mb-4 text-base">Đặc điểm nổi bật</h4>
        <div className="flex flex-col gap-3">
          {HIGHLIGHTS.map(highlight => (
            <div key={highlight.id} className="flex items-center space-x-3">
              <Checkbox 
                id={`highlight-${highlight.id}`}
                checked={highlights.includes(highlight.id)}
                onCheckedChange={() => handleHighlightChange(highlight.id)}
                className="border-[#d2d2d7] data-[state=checked]:bg-apple-blue data-[state=checked]:border-apple-blue"
              />
              <label htmlFor={`highlight-${highlight.id}`} className="text-sm font-medium leading-none text-apple-dark cursor-pointer">
                {highlight.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Mức giá */}
      <div>
        <h4 className="font-semibold text-apple-dark mb-4 text-base">Mức giá</h4>
        <div className="flex flex-col gap-3">
          {PRICE_RANGES.map(range => (
            <div key={range.id} className="flex items-center space-x-3">
              <Checkbox 
                id={`price-${range.id}`}
                checked={priceRanges.includes(range.id)}
                onCheckedChange={() => handlePriceChange(range.id)}
                className="border-[#d2d2d7] data-[state=checked]:bg-apple-blue data-[state=checked]:border-apple-blue"
              />
              <label htmlFor={`price-${range.id}`} className="text-sm font-medium leading-none text-apple-dark cursor-pointer">
                {range.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-[#d2d2d7]">
        <Button variant="outline" className="w-full text-apple-dark rounded-lg hover:bg-apple-gray" onClick={clearFilters}>
          Xoá bộ lọc
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 font-sans bg-white selection:bg-apple-blue/20">
      
      {/* Breadcrumb & Header Mobile */}
      <div className="flex flex-col mb-4 md:mb-8 mt-4">
        <div className="flex flex-wrap items-center text-[13px] text-apple-secondary mb-4 gap-2">
          <Link to="/" className="hover:text-apple-dark transition-colors">NexTech</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-apple-dark font-bold">
            {categorySlug ? SLUG_LABEL_MAP[categorySlug] : 'Tất cả sản phẩm'}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:block md:w-44 lg:w-[180px] shrink-0 sticky top-24">
          {renderSidebarContent()}
        </aside>

        {/* Right Content */}
        <div className="flex-1 w-full flex flex-col min-w-0">
          
          {/* Top Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-4 sticky top-[3.5rem] md:static z-20 bg-white/95 backdrop-blur-md md:bg-transparent py-2 md:py-0">
            <div className="hidden md:block">
               <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-apple-dark mb-2">
                 {categorySlug ? SLUG_LABEL_MAP[categorySlug] : 'Sản phẩm'}
               </h1>
               <p className="text-apple-secondary text-sm">
                 hiển thị {totalItems} sản phẩm
               </p>
            </div>

            <div className="flex flex-row md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto mt-0">
              
              <div className="md:hidden flex-1 min-w-[120px]">
                <FilterDrawer renderSidebarContent={renderSidebarContent} />
              </div>

              {/* Sort Select on Mobile, Segmented on Desktop */}
              <div className="md:hidden flex-1 min-w-[120px]">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full !h-11 rounded-xl border border-[#d2d2d7] bg-white px-4 text-[15px] font-medium text-apple-dark shadow-sm focus:ring-1 focus:ring-apple-blue flex items-center justify-between transition-colors hover:bg-slate-50 [&>span]:truncate">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-[#d2d2d7] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 min-w-[160px]">
                    <SelectItem value="Mới nhất" className="py-3 pl-3 pr-8 text-[15px] font-medium cursor-pointer rounded-xl hover:bg-slate-50">Mới nhất</SelectItem>
                    <SelectItem value="Giá tăng dần" className="py-3 pl-3 pr-8 text-[15px] font-medium cursor-pointer rounded-xl hover:bg-slate-50">Giá tăng dần</SelectItem>
                    <SelectItem value="Giá giảm dần" className="py-3 pl-3 pr-8 text-[15px] font-medium cursor-pointer rounded-xl hover:bg-slate-50">Giá giảm dần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="hidden md:flex items-center gap-1 bg-apple-gray p-1 rounded-lg border border-[#d2d2d7]">
                {['Mới nhất', 'Giá tăng dần', 'Giá giảm dần'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${sort === s ? 'bg-white shadow-sm text-apple-dark' : 'text-apple-secondary hover:text-apple-dark'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="hidden sm:flex items-center bg-apple-gray p-1 rounded-full">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-apple-secondary hover:text-apple-dark'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-apple-secondary hover:text-apple-dark'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid / List */}
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-apple-blue" />
            </div>
          ) : isError ? (
            <div className="flex-1 flex justify-center items-center py-24 text-red-500">
              Đã xảy ra lỗi khi tải sản phẩm. Vui lòng thử lại.
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center py-24 text-center">
               <p className="text-xl font-medium text-apple-dark mb-2">Không tìm thấy sản phẩm nào.</p>
               <p className="text-apple-secondary">Hãy thử thay đổi điều kiện lọc của bạn.</p>
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 md:gap-6 lg:gap-8 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {products.map(product => (
                <div key={product.id} className={`group relative bg-white border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] md:hover:scale-[1.02] rounded-2xl md:rounded-[24px] transition-all duration-300 p-3 md:p-5 flex ${viewMode === 'list' ? 'flex-row gap-4 md:gap-6 items-center' : 'flex-col'}`}>
                  
                  {/* Image */}
                  <Link to={`/products/${getSlugByCategory(product.category)}/${product.id}`} className={`relative bg-white p-4 md:p-6 rounded-lg md:rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${viewMode === 'list' ? 'w-24 h-24 md:w-40 md:h-40' : 'w-full aspect-square mb-3 md:mb-4 group/img'}`}>
                    {/* Badges — xếp dọc góc trên trái */}
                    <div className="hidden md:flex absolute top-2 left-2 z-10 flex-col gap-1 items-start">
                      {product.isNewArrival && (
                        <span className="text-[#BF4800] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                          MỚI
                        </span>
                      )}
                      {product.discountPercent > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
                          -{product.discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Badge Bán chạy góc trên cùng bên phải */}
                    {product.isBestseller && (
                      <div className="absolute top-2 right-0 z-10 flex items-center justify-center">
                        <span className="bg-orange-500 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shadow-sm">
                          Bán chạy
                        </span>
                      </div>
                    )}
                    
                    <img 
                      src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=400'} 
                      alt={product.name}
                      className={`object-contain w-full h-full mix-blend-multiply transition-transform duration-500 ${viewMode === 'list' ? 'md:group-hover:scale-105' : 'md:group-hover/img:scale-105'}`}
                      loading="lazy"
                    />

                    {/* Sale Countdown ở góc dưới bên phải ảnh */}
                    {product.isSaleActive && product.saleExpiresAt && (
                      <div className="absolute bottom-0 right-0 z-10 flex">
                        <SaleCountdownBadge saleExpiresAt={product.saleExpiresAt} isSaleActive={product.isSaleActive} />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex flex-col flex-1">
                    <Link to={`/products/${getSlugByCategory(product.category)}/${product.id}`} className="block">
                      <h3 className="font-semibold text-sm md:text-[15px] text-apple-dark tracking-tight mb-1 md:group-hover:text-apple-blue transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="hidden md:block text-[13px] text-apple-secondary mb-1 line-clamp-1">
                        {product.brand} • {SLUG_LABEL_MAP[Object.keys(SLUG_MAP).find(k => SLUG_MAP[k] === product.category)] || product.category}
                      </p>
                      {/* Năm ra mắt */}
                      {product.manufactureYear != null && (
                        <p className="hidden md:block text-[12px] text-apple-secondary mb-3">
                          Năm ra mắt: {product.manufactureYear}
                        </p>
                      )}
                    </Link>

                    <div className="mt-auto flex flex-col gap-2 md:gap-3">
                      <div className="flex flex-row gap-2 items-center w-full">
                        <SaleStockBadge saleStock={product.saleStock} saleRemaining={product.saleRemaining} isSaleActive={product.isSaleActive} />
                      </div>
                      {/* Hiện thị giá */}
                      <div className="flex flex-col md:flex-row md:items-end gap-0.5 md:gap-2">
                        {product.discountPercent > 0 ? (
                          <>
                            <span className="font-semibold text-red-500 text-base">
                              {formatVND(product.finalPrice)}
                            </span>
                            <span className="text-xs md:text-sm line-through text-gray-400">
                              {formatVND(product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-base text-apple-dark">
                            {formatVND(product.finalPrice)}
                          </span>
                        )}
                      </div>
                      
                      <div className={`hidden md:flex w-full gap-2 ${viewMode === 'list' ? 'flex-row justify-around gap-32' : 'flex-col'}`}>
                        <Button 
                          className={`rounded-full bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] text-apple-dark font-semibold shadow-sm transition-all active:scale-[0.98] px-0 ${viewMode === 'list' ? 'flex-1' : 'w-full'}`}
                          onClick={(e) => handleAddToCart(e, product.id)}
                          disabled={product.stock === 0 || isAddingToCart}
                        >
                          {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                        </Button>
                        <Button 
                          className={`rounded-full bg-apple-blue hover:bg-apple-blue/90 text-white font-semibold shadow-sm transition-all active:scale-[0.98] px-0 ${viewMode === 'list' ? 'flex-1' : 'w-full'}`}
                          onClick={(e) => handleBuyNow(e, product.id)}
                          disabled={product.stock === 0 || isAddingToCart}
                        >
                          Mua ngay
                        </Button>
                      </div>
                      
                      {/* Rating & Favorite under the button on md+ */}
                      <div className="hidden md:flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-apple-dark">
                           <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                           <span>{(product.rating || 0) > 0 ? (product.rating).toFixed(1) : "Chưa có"}</span>
                        </div>
                        <div className="relative z-10">
                          <FavoriteButton
                            product={{ ...product, isFavorited: favoritedIds.has(product.id) }}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasNextPage && (
            <div className="mt-12 flex justify-center">
               <Button 
                variant="outline" 
                className="rounded-full px-8 h-12 text-sm font-semibold text-apple-dark border-[#d2d2d7] hover:bg-apple-gray min-w-[200px]"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
               >
                 {isFetchingNextPage ? (
                   <Loader2 className="w-5 h-5 animate-spin mx-auto text-apple-secondary" />
                 ) : (
                   'Xem thêm sản phẩm'
                 )}
               </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
