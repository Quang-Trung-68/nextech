import { useState } from 'react';
import usePageTitle from '@/hooks/usePageTitle';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Star, Package, ArrowLeft, ChevronRight, CreditCard } from 'lucide-react';
import { useProduct } from '@/features/product/hooks/useProduct';
import { useAddToCart } from '@/features/cart/hooks/useCartMutations';
import { ProductGallery } from '@/features/product/components/ProductGallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatVND } from '@/utils/price';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';

const CATEGORY_MAP = {
  'smartphone': 'Điện thoại',
  'laptop': 'Laptop',
  'tablet': 'Máy tính bảng',
  'accessory': 'Phụ kiện'
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: response, isLoading, isError } = useProduct(id);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const productName = response?.product?.name;
  usePageTitle(productName || ''); // → "iPhone 15 Pro | NexTech" | "→ NexTech" khi đang load

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container py-8 max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery Skeleton */}
          <div className="space-y-4">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <div className="flex gap-4">
               {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-20 h-20 rounded-xl" />)}
            </div>
          </div>
          {/* Detail Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Not found hoặc lỗi API 
  const product = response?.product;
  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <Package className="w-16 h-16 text-muted-foreground opacity-50 block mb-2" />
        <h2 className="text-2xl font-bold tracking-tight">Không tìm thấy sản phẩm!</h2>
        <p className="text-muted-foreground w-80">
          Sản phẩm này có thể đã bị xóa hoặc không dồn tại trên hệ thống.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/" className="flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> 
            <span>Quay lại trang chủ</span>
          </Link>
        </Button>
      </div>
    );
  }

  const { name, description, price, salePrice, finalPrice, discountPercent, isNewArrival, manufactureYear, stock, category, rating, numReviews, images } = product;
  const isOutOfStock = stock === 0;

  // Xử lý tăng giảm số lượng input
  const handleQuantityChange = (type) => {
    if (type === 'dec' && quantity > 1) {
      setQuantity((q) => q - 1);
    }
    if (type === 'inc' && quantity < stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > stock) val = stock;
    setQuantity(val);
  };

  // Submit giỏ hàng
  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return navigate('/login', { state: { from: location } });
    }

    setIsBuyingNow(false);
    addToCart(
      { productId: id, quantity },
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

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      return navigate('/login', { state: { from: location } });
    }

    setIsBuyingNow(true);
    addToCart(
      { productId: id, quantity },
      {
        onSuccess: () => {
          navigate('/checkout');
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi mua hàng');
          setIsBuyingNow(false);
        }
      }
    );
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4 md:px-6">
      
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center text-[13px] text-apple-secondary mb-8 gap-2">
        <Link to="/" className="hover:text-apple-dark transition-colors text-apple-dark font-medium">NexTech</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to={`/products?category=${category}`} className="hover:text-apple-dark transition-colors">
          {CATEGORY_MAP[category] || category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-apple-secondary font-medium line-clamp-1">{name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-14">
        {/* Gallery ảnh hiển thị */}
        <div className="md:sticky md:top-24 h-fit">
          <ProductGallery images={images} productName={name} />
        </div>

        {/* Thông tin sản phẩm chi tiết */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-2 text-muted-foreground text-sm uppercase font-semibold tracking-wider">
             {CATEGORY_MAP[category] || category}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {name}
          </h1>

          {/* Badges dạng pill */}
          <div className="flex flex-wrap gap-2">
            {isNewArrival && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                ✨ Mới
              </span>
            )}
            {discountPercent > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-600">
                -{discountPercent}% SALE
              </span>
            )}
          </div>

          {/* Giá và Rating layout */}
          <div className="flex flex-wrap items-start gap-4 flex-col">
            {discountPercent > 0 ? (
              <div className="flex flex-col gap-1">
                <span className="text-lg line-through text-gray-400">
                  {formatVND(price)}
                </span>
                <span className="text-3xl font-bold text-red-500 tracking-tighter">
                  {formatVND(finalPrice)}
                </span>
                <span className="text-sm text-green-600 font-medium">
                  Tiết kiệm {formatVND(Number(price) - Number(finalPrice))} ({discountPercent}%)
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-primary tracking-tighter">
                {formatVND(finalPrice)}
              </span>
            )}

            <div className="h-px w-full bg-border" />

            {/* Stars Review Box */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                 <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                 <span className="ml-1.5 font-bold text-base leading-none pt-0.5">{rating > 0 ? rating.toFixed(1) : 0}</span>
              </div>
              <span className="text-sm text-muted-foreground border-l pl-2">
                 ({numReviews} đánh giá)
              </span>
            </div>
          </div>

          {/* Tồn Kho Status Badges + Năm ra mắt */}
          <div className="space-y-2">
            <div>
              {isOutOfStock ? (
                 <Badge variant="destructive" className="px-3 py-1 font-semibold tracking-wide">
                   HẾT HÀNG
                 </Badge>
              ) : stock <= 10 ? (
                 <Badge className="bg-amber-500 hover:bg-amber-600 px-3 py-1 font-semibold tracking-wide border-transparent text-white">
                   CHỈ CÒN {stock} SẢN PHẨM
                 </Badge>
              ) : (
                 <Badge variant="secondary" className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 hover:bg-green-200 border-none font-semibold">
                   CÒN HÀNG (Sẵn {stock})
                 </Badge>
              )}
            </div>
            {/* Năm ra mắt */}
            {manufactureYear != null && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Năm ra mắt:</span> {manufactureYear}
              </p>
            )}
          </div>

          <hr className="bg-border my-2" />

          {/* Description Markdown text (or simple text) */}
          <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </div>

          {/* Action Row Add To Cart */}
          <div className="pt-6 space-y-4">
            <p className="font-medium text-sm">Số lượng</p>
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Stepper Số Lượng Input */}
              <div className="flex items-center w-36 h-12 bg-muted/50 rounded-lg p-1 border">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-full w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-md"
                   onClick={() => handleQuantityChange('dec')}
                   disabled={isOutOfStock || quantity <= 1}
                 >
                   <Minus className="w-4 h-4" />
                 </Button>

                 <Input 
                   type="number" 
                   className="h-full border-0 bg-transparent text-center font-bold text-lg remove-arrow px-0 outline-none focus-visible:ring-0 shadow-none flex-1 font-mono"
                   value={quantity}
                   onChange={handleInputChange}
                   disabled={isOutOfStock}
                   min={1}
                   max={stock}
                 />

                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-full w-10 text-muted-foreground hover:text-foreground shrink-0 rounded-md"
                   onClick={() => handleQuantityChange('inc')}
                   disabled={isOutOfStock || quantity >= stock}
                 >
                   <Plus className="w-4 h-4" />
                 </Button>
              </div>

              {/* Button Add To Cart */}
              <Button 
                variant="outline"
                size="lg" 
                className="flex-1 min-w-[160px] h-12 text-base font-semibold shadow-sm active:scale-[0.98] transition-all"
                disabled={isOutOfStock || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart && !isBuyingNow ? (
                    'Đang thêm...'
                ) : (
                  <>
                     <ShoppingCart className="w-5 h-5 mr-2" />
                     {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                  </>
                )}
              </Button>

              {/* Button Buy Now */}
              <Button 
                size="lg" 
                className="flex-1 min-w-[160px] h-12 text-base font-semibold shadow-md active:scale-[0.98] transition-all"
                disabled={isOutOfStock || isAddingToCart}
                onClick={handleBuyNow}
              >
                {isAddingToCart && isBuyingNow ? (
                    'Đang xử lý...'
                ) : (
                  <>
                     <CreditCard className="w-5 h-5 mr-2" />
                     {isOutOfStock ? 'Hết hàng' : 'Mua ngay'}
                  </>
                )}
              </Button>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetailPage;
