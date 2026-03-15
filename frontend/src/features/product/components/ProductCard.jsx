import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Star, Image as ImageIcon, Heart, ShoppingCart } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { formatCurrency } from '../../../utils/formatCurrency';
import { useAddToCart } from '../../cart/hooks/useCartMutations';
import useAuthStore from '../../../stores/useAuthStore';
import { toast } from 'sonner';

export function ProductCard({ product }) {
  const { id, name, price, rating, stock, images } = product;
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
      <Link to={`/products/${id}`} className="flex-1 flex flex-col relative">
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

          {/* Badges tĩnh (nắp góc trái, phải) */}
          {stock <= 10 && stock > 0 && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-white border-0 z-10"
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

          <div className="flex items-end justify-between w-full mt-1">
            <span className="font-bold text-[17px] text-primary tracking-tight">
              {formatCurrency(price)}
            </span>
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
        
        {/* Rating and Wishlist */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
             <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
             <span>{rating > 0 ? rating.toFixed(1) : "0"}</span>
          </div>
          <button 
            className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.success("Đã thêm vào mục Yêu thích!");
            }}
          >
            <Heart className="w-4 h-4 text-blue-500" /> Yêu thích
          </button>
        </div>
      </div>
    </Card>
  );
}
