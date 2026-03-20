import React, { useState, useMemo } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { useInfiniteQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { Link, useSearchParams } from 'react-router-dom';
import { Grid, List, SlidersHorizontal, ChevronRight, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddToCart } from '@/features/cart/hooks/useCartMutations';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatVND } from '@/utils/price';
import { useMyFavorites, FavoriteButton } from '@/features/favorites';

const CATEGORIES = [
  { id: 'smartphone', label: 'Điện thoại' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'tablet', label: 'Máy tính bảng' },
  { id: 'accessory', label: 'Phụ kiện' }
];
const BRANDS = ['Samsung', 'Apple', 'Sony', 'Dell', 'LG'];
const PRICE_RANGES = [
  { id: 'under-5', label: 'Dưới 5tr', min: 0, max: 4999999 },
  { id: '5-15', label: '5 – 15tr', min: 5000000, max: 15000000 },
  { id: '15-30', label: '15 – 30tr', min: 15000000, max: 30000000 },
  { id: 'over-30', label: 'Trên 30tr', min: 30000000, max: 999999999 }
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive categories from URL
  const categoryParam = searchParams.get('category');
  const categories = categoryParam ? categoryParam.split(',') : [];

  const pageLabel = categories.length === 1
    ? CATEGORIES.find(c => c.id === categories[0])?.label
    : null;
  usePageTitle(pageLabel || 'Sản phẩm'); // → "Điện thoại | NexTech" or "Sản phẩm | NexTech"

  const [brands, setBrands] = useState([]);
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

  // Build Query Params
  const getQueryParams = (pageParam) => {
    let sortParam = 'newest';
    if (sort === 'Giá tăng dần') sortParam = 'price_asc';
    if (sort === 'Giá giảm dần') sortParam = 'price_desc';

    const params = { page: pageParam, limit, sort: sortParam };
    if (categories.length > 0) params.category = categories.join(',');
    if (brands.length > 0) params.brand = brands.join(',');
    
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
    queryKey: ['products', categories, brands, priceRanges, sort],
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
  const handleCategoryChange = (catId) => {
    const newCategories = categories.includes(catId) 
      ? categories.filter(c => c !== catId) 
      : [...categories, catId];
    
    const newParams = new URLSearchParams(searchParams);
    if (newCategories.length > 0) {
      newParams.set('category', newCategories.join(','));
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleBrandChange = (brand) => {
    setBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const handlePriceChange = (priceId) => {
    setPriceRanges(prev => prev.includes(priceId) ? prev.filter(p => p !== priceId) : [...prev, priceId]);
  };

  const clearFilters = () => {
    setBrands([]);
    setPriceRanges([]);

    const newParams = new URLSearchParams(searchParams);
    newParams.delete('category');
    setSearchParams(newParams, { replace: true });
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col gap-8 w-full">
      {/* Danh mục */}
      <div>
        <h4 className="font-semibold text-apple-dark mb-4 text-base">Danh mục</h4>
        <div className="flex flex-col gap-3">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="flex items-center space-x-3">
              <Checkbox 
                id={`cat-${cat.id}`}
                checked={categories.includes(cat.id)}
                onCheckedChange={() => handleCategoryChange(cat.id)}
                className="border-[#d2d2d7] data-[state=checked]:bg-apple-blue data-[state=checked]:border-apple-blue"
              />
              <label htmlFor={`cat-${cat.id}`} className="text-sm font-medium leading-none text-apple-dark peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                {cat.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Thương hiệu */}
      <div>
        <h4 className="font-semibold text-apple-dark mb-4 text-base">Thương hiệu</h4>
        <div className="flex flex-col gap-3">
          {BRANDS.map(brand => (
            <div key={brand} className="flex items-center space-x-3">
              <Checkbox 
                id={`brand-${brand}`}
                checked={brands.includes(brand)}
                onCheckedChange={() => handleBrandChange(brand)}
                className="border-[#d2d2d7] data-[state=checked]:bg-apple-blue data-[state=checked]:border-apple-blue"
              />
              <label htmlFor={`brand-${brand}`} className="text-sm font-medium leading-none text-apple-dark cursor-pointer">
                {brand}
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
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 font-sans bg-white selection:bg-apple-blue/20">
      
      {/* Breadcrumb & Header Mobile */}
      <div className="flex flex-col mb-8 mt-4">
        <div className="flex items-center text-xs text-apple-secondary mb-4 space-x-1">
          <Link to="/" className="hover:text-apple-dark transition-colors">NexTech</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-apple-dark font-medium">
            {categories.length === 1 ? CATEGORIES.find(c => c.id === categories[0])?.label : 'Tất cả sản phẩm'}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:block w-[280px] shrink-0 sticky top-24">
          {renderSidebarContent()}
        </aside>

        {/* Right Content */}
        <div className="flex-1 w-full flex flex-col min-w-0">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
               <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-apple-dark mb-2">
                 {categories.length === 1 ? CATEGORIES.find(c => c.id === categories[0])?.label : 'Sản phẩm'}
               </h1>
               <p className="text-apple-secondary text-sm">
                 hiển thị {totalItems} sản phẩm
               </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#d2d2d7] hover:bg-apple-gray transition-colors focus:outline-none focus:ring-2 focus:ring-apple-blue">
                    <SlidersHorizontal className="w-4 h-4 text-apple-dark" />
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[350px] overflow-y-auto p-6">
                    <SheetHeader className="mb-6 p-0">
                      <SheetTitle className="text-left font-bold text-apple-dark">Lọc Sản Phẩm</SheetTitle>
                    </SheetHeader>
                    {renderSidebarContent()}
                  </SheetContent>
                </Sheet>
              </div>

              {/* Sort Select */}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[160px] h-10 rounded-full border-[#d2d2d7] text-sm focus:ring-1 focus:ring-apple-blue">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mới nhất">Mới nhất</SelectItem>
                  <SelectItem value="Giá tăng dần">Giá tăng dần</SelectItem>
                  <SelectItem value="Giá giảm dần">Giá giảm dần</SelectItem>
                </SelectContent>
              </Select>

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
            <div className={`grid gap-6 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {products.map(product => (
                <div key={product.id} className={`group relative bg-white border border-transparent hover:border-[#d2d2d7] hover:shadow-sm rounded-2xl transition-all duration-300 p-4 flex ${viewMode === 'list' ? 'flex-row gap-6 items-center' : 'flex-col'}`}>
                  
                  {/* FavoriteButton overlay */}
                  <div className="absolute top-4 right-4 z-10">
                    <FavoriteButton
                      product={{ ...product, isFavorited: favoritedIds.has(product.id) }}
                      size="sm"
                    />
                  </div>

                  {/* Image */}
                  <Link to={`/products/${product.id}`} className={`relative bg-apple-gray rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${viewMode === 'list' ? 'w-40 h-40' : 'w-full aspect-square mb-6 group/img'}`}>
                    {/* Badges — xếp dọc góc trên trái */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      {product.isNewArrival && (
                        <span className="bg-green-500 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shadow-sm">
                          Mới
                        </span>
                      )}
                      {product.discountPercent > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
                          -{product.discountPercent}%
                        </span>
                      )}
                    </div>
                    
                    <img 
                      src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=400'} 
                      alt={product.name}
                      className={`object-cover w-full h-full mix-blend-multiply transition-transform duration-500 ${viewMode === 'list' ? 'group-hover:scale-105' : 'group-hover/img:scale-105'}`}
                      loading="lazy"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex flex-col flex-1">
                    <Link to={`/products/${product.id}`} className="block">
                      <h3 className="font-semibold text-[15px] text-apple-dark tracking-tight mb-1 group-hover:text-apple-blue transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-[13px] text-apple-secondary mb-1 line-clamp-1">
                        {product.brand} • {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
                      </p>
                      {/* Năm ra mắt */}
                      {product.manufactureYear != null && (
                        <p className="text-[12px] text-apple-secondary mb-3">
                          Năm ra mắt: {product.manufactureYear}
                        </p>
                      )}
                    </Link>

                    <div className="mt-auto flex flex-col gap-3">
                      {/* Hiện thị giá */}
                      <div className="flex items-end gap-2">
                        {product.discountPercent > 0 ? (
                          <>
                            <span className="text-sm line-through text-gray-400">
                              {formatVND(product.price)}
                            </span>
                            <span className="font-semibold text-red-500 text-base">
                              {formatVND(product.finalPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-semibold text-base text-apple-dark">
                            {formatVND(product.finalPrice)}
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full rounded-full bg-apple-blue hover:bg-apple-blue/90 text-white font-semibold shadow-none transition-all active:scale-[0.98]"
                        onClick={(e) => handleAddToCart(e, product.id)}
                        disabled={product.stock === 0 || isAddingToCart}
                      >
                        {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </Button>
                      
                      {/* Rating under the button */}
                      <div className="flex items-center pt-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-apple-dark">
                           <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                           <span>{(product.rating || 0) > 0 ? (product.rating).toFixed(1) : "Chưa có"}</span>
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
