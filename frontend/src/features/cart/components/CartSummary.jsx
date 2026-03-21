import { Button } from '@/components/ui/button';
import { formatVND } from '@/utils/price';
import { Link } from 'react-router-dom';
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

export function CartSummary({ totalItems, totalPrice, onClearCart }) {
  return (
    <div className="w-full bg-white lg:p-6 lg:rounded-2xl lg:border lg:border-[#d2d2d7] lg:sticky lg:top-24 space-y-3 lg:space-y-6">
      <h2 className="text-xl font-bold text-apple-dark">Tóm tắt đơn hàng</h2>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Tổng số lượng:</span>
          <span className="font-medium text-foreground">{totalItems} sản phẩm</span>
        </div>
        <div className="hidden lg:block h-px bg-border w-full" />
        <div className="flex justify-between items-center text-apple-dark">
          <span className="font-semibold">Tạm tính:</span>
          <span className="text-2xl font-bold text-primary">{formatVND(totalPrice)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground italic text-right mt-1">
          (Phí vận chuyển tính ở bước tiếp theo)
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <Button asChild className="w-full font-semibold h-12 rounded-xl bg-apple-blue hover:bg-apple-blue/90 shadow-sm text-base active:scale-[0.98] transition-all">
          <Link to="/checkout">Tiến hành thanh toán</Link>
        </Button>
        
        <AlertDialog>
          <div className="w-full flex justify-center lg:mt-4">
            <AlertDialogTrigger asChild>
              <button className="text-sm font-medium text-destructive hover:underline opacity-80 hover:opacity-100 transition-opacity">
                Xóa tất cả
              </button>
            </AlertDialogTrigger>
          </div>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa tất cả giỏ hàng?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={onClearCart} className="bg-destructive hover:bg-destructive/90 text-white">
                Xóa tất cả
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
