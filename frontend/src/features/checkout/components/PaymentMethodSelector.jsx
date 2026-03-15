import { Banknote, CreditCard } from 'lucide-react';

export function PaymentMethodSelector({ register, selectedMethod }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border mt-6">
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-4">Phương thức thanh toán</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* COD Option */}
        <label
           className={`relative border rounded-xl p-4 flex flex-col items-start cursor-pointer transition-all ${
             selectedMethod === 'COD' 
              ? 'border-apple-blue shadow-[0_0_0_1px_rgba(0,102,204,1)] bg-apple-blue/5' 
              : 'border-border hover:border-muted-foreground/50'
           }`}
        >
          <input 
            type="radio" 
            value="COD" 
            {...register('paymentMethod')} 
            className="sr-only" 
          />
          <div className="flex items-center gap-3 w-full">
            <div className={`p-2 rounded-full ${selectedMethod === 'COD' ? 'bg-apple-blue/10 text-apple-blue' : 'bg-muted text-muted-foreground'}`}>
               <Banknote className="w-5 h-5" />
            </div>
            <div>
               <p className="font-semibold text-sm text-foreground">Thanh toán khi nhận hàng</p>
               <p className="text-xs text-muted-foreground mt-0.5">Tiền mặt (COD)</p>
            </div>
          </div>
        </label>

        {/* STRIPE Option */}
        <label
           className={`relative border rounded-xl p-4 flex flex-col items-start cursor-pointer transition-all ${
             selectedMethod === 'STRIPE' 
              ? 'border-apple-blue shadow-[0_0_0_1px_rgba(0,102,204,1)] bg-apple-blue/5' 
              : 'border-border hover:border-muted-foreground/50'
           }`}
        >
          <input 
            type="radio" 
            value="STRIPE" 
            {...register('paymentMethod')} 
            className="sr-only" 
          />
          <div className="flex items-center gap-3 w-full">
            <div className={`p-2 rounded-full ${selectedMethod === 'STRIPE' ? 'bg-apple-blue/10 text-apple-blue' : 'bg-muted text-muted-foreground'}`}>
               <CreditCard className="w-5 h-5" />
            </div>
            <div>
               <p className="font-semibold text-sm text-foreground">Thanh toán qua thẻ</p>
               <p className="text-xs text-muted-foreground mt-0.5">Visa, Mastercard, Thẻ tín dụng</p>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
