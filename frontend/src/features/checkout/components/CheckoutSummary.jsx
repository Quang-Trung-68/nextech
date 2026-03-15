import { formatCurrency } from '../../../utils/formatCurrency';

export function CheckoutSummary({ cartItems, totalItems, totalPrice }) {
  return (
    <div className="bg-[#fbfcff] p-6 lg:p-8 rounded-3xl border border-apple-blue/10 sticky top-24">
      <h2 className="text-xl font-bold text-apple-dark tracking-tight mb-6">Đơn hàng của bạn</h2>

      <div className="flex flex-col gap-5 max-h-[350px] overflow-y-auto mb-6 pr-2 custom-scrollbar border-b border-[#f5f5f7] pb-6">
        {cartItems?.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="relative">
              <img 
                src={item.image || '/placeholder.png'} 
                alt={item.name} 
                className="w-16 h-16 object-cover rounded-xl border border-border"
              />
              <span className="absolute -top-2 -right-2 bg-muted text-muted-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
               <h4 className="text-sm font-semibold text-apple-dark line-clamp-2 leading-snug">{item.name}</h4>
               <p className="text-sm font-bold text-primary mt-1">{formatCurrency(item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center text-apple-secondary">
          <span>Tạm tính ({totalItems} sản phẩm)</span>
          <span className="font-semibold text-foreground">{formatCurrency(totalPrice)}</span>
        </div>
        <div className="flex justify-between items-center text-apple-secondary">
          <span>Phí vận chuyển</span>
          <span className="font-semibold text-green-600">Miễn phí</span>
        </div>
        <div className="pt-4 mt-2 border-t border-[#f5f5f7] flex justify-between items-center">
          <span className="text-base font-bold text-apple-dark">Tổng cộng</span>
          <span className="text-2xl font-black text-primary">{formatCurrency(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
