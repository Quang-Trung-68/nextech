import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getSlugByCategory } from '@/constants/category';
// Removed duplicate
import { Star, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAddToCart } from '@/features/cart/hooks/useCartMutations';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { FavoriteButton } from '@/features/favorites';
import SaleCountdownBadge from '@/components/product/SaleCountdownBadge';
import SaleStockBadge from '@/components/product/SaleStockBadge';

export function ProductCard({ product }) {
  const { id, name, price, rating, stock, images, category, hasVariants } = product;
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

  // Ảnh đầu tiên (nếu có)
  const firstImage = images?.[0]?.url;
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return navigate('/login', { state: { from: location.pathname + location.search } });
    }

    if (hasVariants) {
      navigate(`/products/${getSlugByCategory(category)}/${id}`);
      return;
    }

    addToCart(
      { productId: id, quantity: 1 },
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

  return (
    <Card className="overflow-hidden group flex flex-col h-full bg-white rounded-3xl border border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:scale-[1.05] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <Link to={`/products/${getSlugByCategory(category)}/${id}`} className="flex-1 flex flex-col relative">
        {/* Container hiển thị ảnh */}
        <div className="relative aspect-square w-full bg-white p-5 flex items-center justify-center">
          {firstImage ? (
            <img
              src={firstImage}
              alt={name}
              className="object-contain w-full h-full"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground w-full h-full">
              <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
              <span className="text-xs">Không có ảnh</span>
            </div>
          )}


          {product.isSaleActive && product.saleExpiresAt && (
            <div className="absolute bottom-2 right-2 z-10 flex">
              <SaleCountdownBadge saleExpiresAt={product.saleExpiresAt} isSaleActive={product.isSaleActive} />
            </div>
          )}
        </div>

        {/* Nội dung card text */}
        <div className="px-4 pb-2 flex flex-col flex-1 gap-1 mt-2">
          <div className="flex flex-row flex-wrap items-center justify-start gap-2">
            {product.isSaleActive && price > product.effectivePrice && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-red-500 text-white">
                -{Math.round(((price - product.effectivePrice) / price) * 100)}%
              </span>
            )}
            {product.isNewArrival && (
              <span className="text-xs text-[#BF4800]">
                MỚI
              </span>
            )}
            {product.isBestseller && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-orange-400 text-orange-500">
                BÁN CHẠY
              </span>
            )}
            {hasVariants && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700">
                Nhiều tùy chọn
              </span>
            )}
            {!hasVariants && stock <= 10 && stock > 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500 text-white">
                Sắp hết
              </span>
            )}
            {!hasVariants && stock === 0 && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground">
                Hết hàng
              </span>
            )}
          </div>

          <h3 className="font-semibold text-foreground text-[14px] line-clamp-2 leading-[1.4] flex-1 hover:text-apple-blue transition-colors" title={name}>
            {name}
          </h3>

          <div className="flex flex-row gap-2 my-1 items-center w-full">
            <SaleStockBadge saleStock={product.saleStock} saleRemaining={product.saleRemaining} isSaleActive={product.isSaleActive} />
          </div>

          <div className="flex items-end justify-between w-full mt-1">
            {product.isSaleActive ? (
              <div className="flex flex-col">
                <span className="font-bold text-[16px] text-red-600 tracking-tight">
                  {formatCurrency(product.effectivePrice)}
                </span>
                <span className="text-[13px] text-gray-400 line-through">
                  {formatCurrency(price)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-[16px] text-primary tracking-tight">
                {formatCurrency(price)}
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Container nút (Nằm ngoài thẻ Link để tránh lỗi HTML Button lồng trong Thẻ A hoặc bị route đè) */}
      <div className="px-4 pb-4 pt-2 mt-auto flex flex-col gap-3">
        {/* Add to cart Button */}
        <Button 
            size="sm" 
            className="w-full h-9 font-semibold text-[13px] active:scale-[0.98] transition-all bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-lg"
            onClick={handleAddToCart}
            disabled={(!hasVariants && stock === 0) || isAddingToCart}
          >
            {isAddingToCart ? 'Đang thêm...' : hasVariants ? 'Chọn tùy chọn' : 'Thêm vào giỏ'}
        </Button>
        
        {/* Rating & Favorite */}
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold">
             <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
             <span>{rating > 0 ? rating.toFixed(1) : "0"}</span>
          </div>
          <div className="relative z-10">
            <FavoriteButton product={product} size="sm" />
          </div>
        </div>
      </div>
    </Card>
  );
}
