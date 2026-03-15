import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="w-32 h-32 mb-6 bg-apple-gray/50 rounded-full flex items-center justify-center border border-dashed border-[#d2d2d7]">
        <ShoppingCart className="w-16 h-16 text-muted-foreground opacity-50 block" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2 text-apple-dark">Giỏ hàng của bạn đang trống</h2>
      <p className="text-muted-foreground w-full max-w-sm mb-8">
        Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy khám phá các sản phẩm của chúng tôi nhé.
      </p>
      <Button asChild size="lg" className="rounded-full px-8 h-12 shadow-sm font-semibold">
        <Link to="/" className="flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 
          <span>Tiếp tục mua sắm</span>
        </Link>
      </Button>
    </div>
  );
}
