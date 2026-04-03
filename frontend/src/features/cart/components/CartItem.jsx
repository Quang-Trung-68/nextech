import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatVND } from '@/utils/price';
import { Link } from 'react-router-dom';
import { VariantOptionBadges } from '@/components/product/VariantOptionBadges';

const getOptimizedImage = (url, width) => {
  if (!url) return '/placeholder.png';
  if (url.includes('cloudinary.com') && !url.includes('upload/w_')) {
    return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
  }
  return url;
};

export function CartItem({ item, onUpdateQuantity, onRemove }) {
  const {
    productId,
    variantId,
    name,
    price,
    finalPrice,
    discountPercent,
    image,
    stock,
    quantity,
    lineTotal,
    subtotal,
    originalUnitPrice,
    variantOptions,
  } = item;
  const displayLineTotal = lineTotal ?? subtotal;
  const listUnit =
    originalUnitPrice != null && originalUnitPrice !== ''
      ? Number(originalUnitPrice)
      : Number(price);
  const displayFinalPrice = finalPrice != null ? Number(finalPrice) : listUnit;
  const showSale = displayFinalPrice < listUnit - 0.5 || (discountPercent ?? 0) > 0;
  const itemImage = getOptimizedImage(image, 120);

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > stock) val = stock;
    onUpdateQuantity(productId, val, variantId);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(productId, quantity - 1, variantId);
    }
  };

  const increaseQuantity = () => {
    if (quantity < stock) {
      onUpdateQuantity(productId, quantity + 1, variantId);
    }
  };

  return (
    <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl lg:rounded-2xl border border-border transition-all hover:border-[#d2d2d7]">
      <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden border border-border bg-white flex items-center justify-center">
        <img 
          src={itemImage} 
          alt={name} 
          className="w-full h-full object-contain p-1" 
          loading="lazy" 
          width={120} 
          height={120} 
        />
      </div>
      <div className="flex flex-col flex-1 justify-between gap-2">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <Link to={`/products/all/${productId}`} className="font-semibold text-sm sm:text-base text-apple-dark hover:text-apple-blue transition-colors line-clamp-2">
              {name}
            </Link>
            <VariantOptionBadges options={variantOptions} className="mt-1" />
            <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
              {showSale ? (
                <>
                  <span className="font-bold text-sm sm:text-base text-red-500">{formatVND(displayFinalPrice)}</span>
                  <span className="text-[11px] sm:text-sm line-through text-gray-400">{formatVND(listUnit)}</span>
                </>
              ) : (
                <span className="font-bold text-sm sm:text-base text-primary">{formatVND(displayFinalPrice)}</span>
              )}
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="inline-flex items-center justify-center shrink-0 min-h-[44px] min-w-[44px] -mt-1 -mr-1 text-muted-foreground hover:text-destructive transition-colors rounded-full rounded-tr-xl hover:bg-destructive/10 border-0 focus-visible:outline-none">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa "{name}" khỏi giỏ hàng?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="min-h-[44px]">Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove(productId, variantId)} className="bg-destructive hover:bg-destructive/90 text-white min-h-[44px]">
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center rounded-lg bg-muted/40 border overflow-hidden">
            {quantity <= 1 ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 sm:h-10 sm:w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-accent transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="min-h-[44px]">Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(productId, variantId)} className="bg-destructive hover:bg-destructive/90 text-white min-h-[44px]">
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <button 
                type="button"
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 sm:h-10 sm:w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                onClick={decreaseQuantity}
              >
                <Minus className="w-4 h-4" />
              </button>
            )}

            <Input 
              type="number" 
              className="h-11 sm:h-10 w-12 border-0 bg-transparent text-center font-semibold text-base px-0 remove-arrow outline-none focus-visible:ring-0 shadow-none font-mono"
              value={quantity}
              onChange={handleInputChange}
              onBlur={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) val = 1;
                if (val !== quantity) onUpdateQuantity(productId, val, variantId);
              }}
              min={1}
              max={stock}
            />

            <button 
              type="button"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 sm:h-10 sm:w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              onClick={increaseQuantity}
              disabled={quantity >= stock}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-sm sm:text-base text-apple-dark">
              {formatVND(displayLineTotal)}
            </p>
            {stock <= 10 && (
              <span className="text-[11px] sm:text-xs text-muted-foreground block mt-0.5">
                Còn lại {stock}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
