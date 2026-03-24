import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getSlugByCategory } from '@/constants/category';
// Removed duplicate
import { Star, Image as ImageIcon, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatCurrency';
import { useAddToCart } from '@/features/cart/hooks/useCartMutations';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';
import { FavoriteButton } from '@/features/favorites';
import SaleCountdownBadge from '@/components/product/SaleCountdownBadge';
import SaleStockBadge from '@/components/product/SaleStockBadge';

export function ProductCard({ product }) {
  const { id, name, price, rating, stock, images, category } = product;
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
    <Card className="overflow-hidden group flex flex-col h-full hover:shadow-lg transition-all duration-300 relative border-slate-200 dark:border-slate-800">
      <Link to={`/products/${getSlugByCategory(category)}/${id}`} className="flex-1 flex flex-col relative">
        {/* Container hiển thị ảnh */}
        <div className="relative aspect-square w-full bg-slate-50 dark:bg-slate-900 overflow-hidden group-hover:bg-slate-100 flex items-center justify-center">
          {firstImage ? (
            <img
              src={firstImage}
              alt={name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground w-full h-full">
              <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
              <span className="text-xs">Không có ảnh</span>
            </div>
          )}

          {/* Bán chạy Badge overlay — góc trên bên phải */}
          {product.isBestseller && (
            <div className="absolute top-2 right-2 z-10">
              <span className="bg-orange-500 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shadow-sm">
                Bán chạy
              </span>
            </div>
          )}

          {/* Badge Sắp hết — đẩy sang trái để không đè FavoriteButton */}
          {stock <= 10 && stock > 0 && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 bg-amber-500 hover:bg-amber-600 text-white border-0 z-10"
            >
              Sắp hết
            </Badge>
          )}

          {stock === 0 && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
              <Badge variant="destructive" className="px-3 py-1 text-sm font-semibold uppercase tracking-wider backdrop-blur-md">
                Hết hàng
              </Badge>
            </div>
          )}
        </div>

        {/* Nội dung card text */}
        <div className="p-4 pb-0 flex flex-col flex-1 gap-2">
          <h3 className="font-semibold text-foreground text-[15px] line-clamp-2 leading-[1.4] flex-1 hover:text-apple-blue transition-colors" title={name}>
            {name}
          </h3>

          <div className="flex flex-row gap-2 my-1 items-center w-full">
            <SaleCountdownBadge saleExpiresAt={product.saleExpiresAt} isSaleActive={product.isSaleActive} />
            <SaleStockBadge saleStock={product.saleStock} saleRemaining={product.saleRemaining} isSaleActive={product.isSaleActive} />
          </div>

          <div className="flex items-end justify-between w-full mt-1">
            {product.isSaleActive ? (
              <div className="flex flex-col">
                <span className="font-bold text-[17px] text-red-600 tracking-tight">
                  {formatCurrency(product.effectivePrice)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {formatCurrency(price)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-[17px] text-primary tracking-tight">
                {formatCurrency(price)}
              </span>
            )}
          </div>
        </div>
      </Link>
      
      {/* Container nút (Nằm ngoài thẻ Link để tránh lỗi HTML Button lồng trong Thẻ A hoặc bị route đè) */}
      <div className="p-4 pt-3 mt-auto flex flex-col gap-3">
        {/* Add to cart Button */}
        <Button 
            size="sm" 
            className="w-full h-10 font-semibold text-sm active:scale-[0.98] transition-all bg-[#0066cc] hover:bg-[#005bb5] text-white rounded-lg"
            onClick={handleAddToCart}
            disabled={stock === 0 || isAddingToCart}
          >
            {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
        </Button>
        
        {/* Rating & Favorite */}
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
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
