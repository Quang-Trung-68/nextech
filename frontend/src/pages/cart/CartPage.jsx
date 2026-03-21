import usePageTitle from '@/hooks/usePageTitle';
import { useCart } from '@/features/cart/hooks/useCart';
import { useUpdateCartItem, useRemoveCartItem, useClearCart } from '@/features/cart/hooks/useCartMutations';
import { CartItem } from '@/features/cart/components/CartItem';
import { CartSummary } from '@/features/cart/components/CartSummary';
import { CartSkeleton } from '@/features/cart/components/CartSkeleton';
import { EmptyCart } from '@/features/cart/components/EmptyCart';
import { Package, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CartPage = () => {
  usePageTitle('Giỏ hàng'); // → "Giỏ hàng | NexTech"

  const { cartItems, totalItems, totalPrice, isLoading, isError, refetch } = useCart();
  const { mutate: updateQuantity } = useUpdateCartItem();
  const { mutate: removeItem } = useRemoveCartItem();
  const { mutate: clearCart } = useClearCart();

  const handleUpdateQuantity = (productId, quantity) => {
    updateQuantity({ productId, quantity });
  };

  const handleRemove = (productId) => {
    removeItem(productId);
  };

  const handleClearCart = () => {
    clearCart();
  };

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <Package className="w-16 h-16 text-muted-foreground opacity-50 block mb-2" />
        <h2 className="text-2xl font-bold tracking-tight text-apple-dark">Đã có lỗi xảy ra!</h2>
        <p className="text-muted-foreground w-80">
          Không thể tải dữ liệu giỏ hàng. Vui lòng thử lại sau.
        </p>
        <Button onClick={() => refetch()} className="mt-4" variant="outline">
          <RefreshCcw className="w-4 h-4 mr-2" /> Thử lại
        </Button>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-apple-dark tracking-tight mb-2">Giỏ hàng của bạn</h1>
        <p className="text-muted-foreground">
          Bạn đang có {totalItems} sản phẩm trong giỏ hàng.
        </p>
      </div>
      
      <div className="grid lg:grid-cols-12 gap-8 items-start relative">
        <div className="lg:col-span-8 space-y-4 pb-40 lg:pb-0">
          {cartItems.map((item) => (
            <CartItem 
              key={item.id} 
              item={item} 
              onUpdateQuantity={handleUpdateQuantity} 
              onRemove={handleRemove} 
            />
          ))}
        </div>
        
        <div className="lg:col-span-4">
          <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-[#d2d2d7] bg-white z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] lg:static lg:p-0 lg:border-0 lg:shadow-none lg:bg-transparent lg:z-auto">
            <CartSummary 
              totalItems={totalItems} 
              totalPrice={totalPrice} 
              onClearCart={handleClearCart} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default CartPage;
