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

  const handleUpdateQuantity = (productId, quantity, variantId) => {
    updateQuantity({ productId, quantity, variantId });
  };

  const handleRemove = (productId, variantId) => {
    removeItem({ productId, variantId });
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
    <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-svh flex flex-col">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-apple-dark tracking-tight mb-1 sm:mb-2">Giỏ hàng của bạn</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Bạn đang có {totalItems} sản phẩm trong giỏ hàng.
        </p>
      </div>
      
      <div className="flex-1 grid lg:grid-cols-12 gap-6 lg:gap-8 items-start relative pb-32 lg:pb-0">
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map((item) => (
            <CartItem 
              key={item.id} 
              item={item} 
              onUpdateQuantity={handleUpdateQuantity} 
              onRemove={handleRemove} 
            />
          ))}
        </div>
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <CartSummary 
            totalItems={totalItems} 
            totalPrice={totalPrice} 
            onClearCart={handleClearCart} 
          />
        </div>
      </div>
    </div>
  );
};
export default CartPage;
