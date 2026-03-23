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

export function CartItem({ item, onUpdateQuantity, onRemove }) {
  const { productId, name, price, finalPrice, discountPercent, image, stock, quantity, lineTotal, subtotal } = item;
  const displayLineTotal = lineTotal ?? subtotal;
  const displayFinalPrice = finalPrice ?? price;
  const itemImage = image || '/placeholder.png'; // Fallback image

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > stock) val = stock;
    onUpdateQuantity(productId, val);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(productId, quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < stock) {
      onUpdateQuantity(productId, quantity + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-xl border border-border">
      <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-border mx-auto sm:mx-0">
        <img src={itemImage} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col flex-1 justify-between">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <Link to={`/products/all/${productId}`} className="font-semibold text-apple-dark hover:text-apple-blue transition-colors line-clamp-2">
              {name}
            </Link>
            {/* Giá: gạch ngang nếu có giảm giá */}
            <div className="mt-1">
              {discountPercent > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm line-through text-gray-400">{formatVND(price)}</span>
                  <span className="font-bold text-lg text-red-500">{formatVND(displayFinalPrice)}</span>
                </div>
              ) : (
                <div className="font-bold text-lg text-primary">{formatVND(displayFinalPrice)}</div>
              )}
            </div>
          </div>
          
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
            <div className="font-bold text-apple-dark">
              {formatVND(displayLineTotal)}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 text-destructive hover:text-destructive hover:bg-destructive/10 px-2 mt-auto">
                  <Trash2 className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Xóa</span>
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
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRemove(productId)} className="bg-destructive hover:bg-destructive/90 text-white">
                    Xóa
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center h-9 bg-muted/50 rounded-lg p-1 border">
            {quantity <= 1 ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-full w-8 text-muted-foreground hover:text-destructive shrink-0 rounded-md">
                    <Trash2 className="w-3.5 h-3.5" />
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
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(productId)} className="bg-destructive hover:bg-destructive/90 text-white">
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-full w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-md"
                onClick={decreaseQuantity}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
            )}

            <Input 
              type="number" 
              className="h-full w-12 border-0 bg-transparent text-center font-semibold text-sm remove-arrow px-0 outline-none focus-visible:ring-0 shadow-none font-mono"
              value={quantity}
              onChange={handleInputChange}
              onBlur={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) val = 1;
                if (val !== quantity) onUpdateQuantity(productId, val);
              }}
              min={1}
              max={stock}
            />

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-full w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-md"
              onClick={increaseQuantity}
              disabled={quantity >= stock}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          
          <span className="text-xs text-muted-foreground">
            Sẵn có: {stock}
          </span>
        </div>
      </div>
    </div>
  );
}
